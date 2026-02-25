import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/extra-grants?child_id= – Hent ekstrabevillinger for et barn (eller alle)
router.get('/', (req, res) => {
    try {
        const { child_id } = req.query;
        let query = `
            SELECT eg.*, c.first_name as child_first_name, c.last_name as child_last_name
            FROM extra_grants eg
            JOIN children c ON eg.child_id = c.id
            WHERE 1=1
        `;
        const params = [];
        if (child_id) {
            query += ` AND eg.child_id = ?`;
            params.push(child_id);
        }
        query += ` ORDER BY eg.from_date DESC`;

        const rows = db.prepare(query).all(...params);
        res.json(rows);
    } catch (error) {
        console.error('Fejl ved hentning af ekstrabevillinger:', error);
        res.status(500).json({ error: 'Kunne ikke hente ekstrabevillinger' });
    }
});

// GET /api/extra-grants/:id
router.get('/:id', (req, res) => {
    try {
        const row = db.prepare(`
            SELECT eg.*, c.first_name as child_first_name, c.last_name as child_last_name
            FROM extra_grants eg
            JOIN children c ON eg.child_id = c.id
            WHERE eg.id = ?
        `).get(req.params.id);
        if (!row) return res.status(404).json({ error: 'Ekstrabevilling ikke fundet' });
        res.json(row);
    } catch (error) {
        console.error('Fejl ved hentning af ekstrabevilling:', error);
        res.status(500).json({ error: 'Kunne ikke hente ekstrabevilling' });
    }
});

// POST /api/extra-grants – Opret ekstrabevilling (gælder fra d.d. og frem)
router.post('/', (req, res) => {
    try {
        const { child_id, hours, from_date, to_date, comment } = req.body;
        if (!child_id || hours == null || !from_date || !to_date) {
            return res.status(400).json({
                error: 'Barn, antal timer, fra-dato og til-dato er påkrævet'
            });
        }
        const child = db.prepare('SELECT id FROM children WHERE id = ?').get(child_id);
        if (!child) return res.status(404).json({ error: 'Barn ikke fundet' });

        const result = db.prepare(`
            INSERT INTO extra_grants (child_id, hours, from_date, to_date, comment)
            VALUES (?, ?, ?, ?, ?)
        `).run(child_id, Number(hours), from_date, to_date, comment || null);

        const newRow = db.prepare('SELECT * FROM extra_grants WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json(newRow);
    } catch (error) {
        console.error('Fejl ved oprettelse af ekstrabevilling:', error);
        res.status(500).json({ error: 'Kunne ikke oprette ekstrabevilling' });
    }
});

// PUT /api/extra-grants/:id – Opdater ekstrabevilling (gælder fra d.d. og frem)
router.put('/:id', (req, res) => {
    try {
        const { hours, from_date, to_date, comment } = req.body;
        const existing = db.prepare('SELECT * FROM extra_grants WHERE id = ?').get(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Ekstrabevilling ikke fundet' });

        db.prepare(`
            UPDATE extra_grants SET
                hours = COALESCE(?, hours),
                from_date = COALESCE(?, from_date),
                to_date = COALESCE(?, to_date),
                comment = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            hours != null ? Number(hours) : existing.hours,
            from_date || existing.from_date,
            to_date || existing.to_date,
            comment !== undefined ? comment : existing.comment,
            req.params.id
        );

        const updated = db.prepare('SELECT * FROM extra_grants WHERE id = ?').get(req.params.id);
        res.json(updated);
    } catch (error) {
        console.error('Fejl ved opdatering af ekstrabevilling:', error);
        res.status(500).json({ error: 'Kunne ikke opdatere ekstrabevilling' });
    }
});

// DELETE /api/extra-grants/:id
router.delete('/:id', (req, res) => {
    try {
        const existing = db.prepare('SELECT id FROM extra_grants WHERE id = ?').get(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Ekstrabevilling ikke fundet' });
        db.prepare('DELETE FROM extra_grants WHERE id = ?').run(req.params.id);
        res.json({ message: 'Ekstrabevilling slettet' });
    } catch (error) {
        console.error('Fejl ved sletning af ekstrabevilling:', error);
        res.status(500).json({ error: 'Kunne ikke slette ekstrabevilling' });
    }
});

export default router;
