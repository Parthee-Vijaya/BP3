import { Router } from 'express';
import https from 'node:https';
import db from '../db/database.js';

const router = Router();

const kalendariumCache = new Map();
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

function fetchKalendarium(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { agent: httpsAgent, headers: { 'User-Agent': 'BarnepigeTR/1.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
        });
        req.on('error', reject);
        req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

router.get('/kalendarium/:year', async (req, res) => {
    const year = parseInt(req.params.year);
    if (isNaN(year) || year < 1 || year > 9999) {
        return res.status(400).json({ error: 'Ugyldigt år' });
    }

    if (kalendariumCache.has(year)) {
        return res.json(kalendariumCache.get(year));
    }

    try {
        const data = await fetchKalendarium(`https://api.kalendarium.dk/CalendarList/${year}`);

        const holidays = data
            .filter(d => d.holliday === 'True' || d.merke === 'True')
            .map(d => ({
                date: d.date,
                formattedDate: d.formattedDate,
                name: d.danishShort,
                fullName: d.danishLong,
                isPublicHoliday: d.holliday === 'True',
                isChurch: d.kirke === 'True',
                isNotable: d.merke === 'True',
                wikiLink: d.wikiLink ? `https://da.wikipedia.org/wiki/${d.wikiLink}` : null,
            }))
            .reduce((acc, item) => {
                const existing = acc.find(a => a.date === item.date && a.name === item.name);
                if (!existing) acc.push(item);
                return acc;
            }, [])
            .sort((a, b) => a.date.localeCompare(b.date));

        kalendariumCache.set(year, holidays);
        res.json(holidays);
    } catch (error) {
        console.error('Fejl ved hentning fra Kalendarium API:', error);
        res.status(502).json({ error: 'Kunne ikke hente data fra Kalendarium API' });
    }
});

// GET /api/holidays — alle custom helligdage
router.get('/', (req, res) => {
    try {
        const holidays = db.prepare('SELECT * FROM custom_holidays ORDER BY date ASC').all();
        res.json(holidays);
    } catch (error) {
        console.error('Fejl ved hentning af helligdage:', error);
        res.status(500).json({ error: 'Kunne ikke hente helligdage' });
    }
});

// POST /api/holidays — opret ny
router.post('/', (req, res) => {
    try {
        const { date, name, all_day = 1, start_time, end_time, recurring = 0 } = req.body;

        if (!date || !name) {
            return res.status(400).json({ error: 'Dato og navn er påkrævet' });
        }
        if (name.length > 20) {
            return res.status(400).json({ error: 'Navn må maks. være 20 tegn' });
        }

        const result = db.prepare(`
            INSERT INTO custom_holidays (date, name, all_day, start_time, end_time, recurring)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(date, name, all_day ? 1 : 0, all_day ? null : start_time, all_day ? null : end_time, recurring ? 1 : 0);

        const holiday = db.prepare('SELECT * FROM custom_holidays WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json(holiday);
    } catch (error) {
        console.error('Fejl ved oprettelse af helligdag:', error);
        res.status(500).json({ error: 'Kunne ikke oprette helligdag' });
    }
});

// PUT /api/holidays/:id — rediger
router.put('/:id', (req, res) => {
    try {
        const { date, name, all_day, start_time, end_time, recurring } = req.body;
        const existing = db.prepare('SELECT * FROM custom_holidays WHERE id = ?').get(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Helligdag ikke fundet' });
        }
        if (name && name.length > 20) {
            return res.status(400).json({ error: 'Navn må maks. være 20 tegn' });
        }

        db.prepare(`
            UPDATE custom_holidays SET
                date = COALESCE(?, date),
                name = COALESCE(?, name),
                all_day = COALESCE(?, all_day),
                start_time = ?,
                end_time = ?,
                recurring = COALESCE(?, recurring)
            WHERE id = ?
        `).run(
            date || null, name || null, all_day != null ? (all_day ? 1 : 0) : null,
            all_day ? null : (start_time || existing.start_time),
            all_day ? null : (end_time || existing.end_time),
            recurring != null ? (recurring ? 1 : 0) : null,
            req.params.id
        );

        const updated = db.prepare('SELECT * FROM custom_holidays WHERE id = ?').get(req.params.id);
        res.json(updated);
    } catch (error) {
        console.error('Fejl ved opdatering af helligdag:', error);
        res.status(500).json({ error: 'Kunne ikke opdatere helligdag' });
    }
});

// DELETE /api/holidays/:id — slet
router.delete('/:id', (req, res) => {
    try {
        const existing = db.prepare('SELECT * FROM custom_holidays WHERE id = ?').get(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Helligdag ikke fundet' });
        }
        db.prepare('DELETE FROM custom_holidays WHERE id = ?').run(req.params.id);
        res.json({ message: 'Helligdag slettet' });
    } catch (error) {
        console.error('Fejl ved sletning af helligdag:', error);
        res.status(500).json({ error: 'Kunne ikke slette helligdag' });
    }
});

export default router;
