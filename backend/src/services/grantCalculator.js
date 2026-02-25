/**
 * Bevillingsberegning for Barnepige Timeregistrering
 *
 * REGLER:
 * - Bevilling er ALTID pr. barn, uanset antal barnepiger
 * - Både GODKENDTE og AFVENTER GODKENDELSE timer tælles med
 * - Rammebevilling OVERRULER normal bevilling når aktiveret
 *
 * BEVILLINGSPERIODER:
 * - Uge: Mandag → Søndag
 * - Måned: Bruger month_interval_history (fx d. 16 – d. 15); kalendermåned hvis ingen historik
 * - Kvartal: Q1 (01/01-31/03), Q2 (01/04-30/06), Q3 (01/07-30/09), Q4 (01/10-31/12)
 * - Halvår: H1 (01/01-30/06), H2 (01/07-31/12)
 * - År: 01/01 → 31/12
 * - Specifikke ugedage: Timer pr. ugedag, hver uge (kun valgte dage tilladt)
 */

import db from '../db/database.js';

/**
 * Få start og slut dato for en bevillingsperiode
 * @param {string} grantType - Bevillingstype
 * @param {string} dateStr - Reference dato (YYYY-MM-DD)
 * @returns {Object} - { startDate, endDate }
 */
export function getGrantPeriod(grantType, dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth();
    const dayOfWeek = date.getDay(); // 0 = søndag

    switch (grantType) {
        case 'week': {
            // Mandag til søndag
            const monday = new Date(date);
            // Hvis søndag (0), gå 6 dage tilbage, ellers gå (dag-1) dage tilbage
            const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            monday.setDate(date.getDate() - daysToMonday);

            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);

            return {
                startDate: formatDate(monday),
                endDate: formatDate(sunday)
            };
        }

        case 'month': {
            const interval = getMonthIntervalForDate(dateStr);
            return getCustomMonthPeriod(dateStr, interval.start_day, interval.end_day);
        }

        case 'quarter': {
            const quarter = Math.floor(month / 3);
            const quarterStarts = [
                { start: new Date(year, 0, 1), end: new Date(year, 2, 31) },   // Q1
                { start: new Date(year, 3, 1), end: new Date(year, 5, 30) },   // Q2
                { start: new Date(year, 6, 1), end: new Date(year, 8, 30) },   // Q3
                { start: new Date(year, 9, 1), end: new Date(year, 11, 31) }   // Q4
            ];
            return {
                startDate: formatDate(quarterStarts[quarter].start),
                endDate: formatDate(quarterStarts[quarter].end)
            };
        }

        case 'half_year': {
            if (month < 6) {
                return {
                    startDate: `${year}-01-01`,
                    endDate: `${year}-06-30`
                };
            } else {
                return {
                    startDate: `${year}-07-01`,
                    endDate: `${year}-12-31`
                };
            }
        }

        case 'year': {
            return {
                startDate: `${year}-01-01`,
                endDate: `${year}-12-31`
            };
        }

        case 'specific_weekdays': {
            // For specifikke ugedage returneres ugen som periode
            // (beregningen pr. dag håndteres separat)
            const monday = new Date(date);
            const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            monday.setDate(date.getDate() - daysToMonday);

            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);

            return {
                startDate: formatDate(monday),
                endDate: formatDate(sunday)
            };
        }

        default:
            throw new Error(`Ukendt bevillingstype: ${grantType}`);
    }
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Hent det aktive månedsinterval for en dato (fra month_interval_history).
 * Returnerer { start_day, end_day } eller null for standard 1–31.
 */
function getMonthIntervalForDate(dateStr) {
    const row = db.prepare(`
        SELECT start_day, end_day FROM month_interval_history
        WHERE effective_from <= ?
        ORDER BY effective_from DESC
        LIMIT 1
    `).get(dateStr);
    if (!row) return { start_day: 1, end_day: 31 };
    return { start_day: row.start_day, end_day: row.end_day };
}

/**
 * Beregn start- og slutdato for en månedsperiode med brugerdefineret interval.
 * Eksempel: start_day=16, end_day=15 → 16. jan–15. feb, 16. feb–15. mar osv.
 */
function getCustomMonthPeriod(dateStr, startDay, endDay) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed
    const day = date.getDate();

    if (startDay <= endDay) {
        // Samme kalendermåned (fx 1–31)
        const startDate = new Date(year, month, startDay);
        const endDate = new Date(year, month, endDay);
        return { startDate: formatDate(startDate), endDate: formatDate(endDate) };
    }

    // Perioden spænder over to kalendermåneder (fx 16–15)
    if (day <= endDay) {
        // Vi er i den del der slutter denne måned (fx 1–15. feb)
        const endDate = new Date(year, month, endDay);
        const startDate = new Date(year, month - 1, startDay);
        return { startDate: formatDate(startDate), endDate: formatDate(endDate) };
    } else {
        // Vi er i den del der starter denne måned (fx 16–28. feb)
        const startDate = new Date(year, month, startDay);
        const endDate = new Date(year, month + 1, endDay);
        return { startDate: formatDate(startDate), endDate: formatDate(endDate) };
    }
}

// Ugedagsnavne til database queries
const WEEKDAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Sum ekstrabevillingstimer for et barn på en dato (fra-dato <= dateStr <= til-dato).
 */
function getExtraGrantHours(childId, dateStr) {
    const row = db.prepare(`
        SELECT COALESCE(SUM(hours), 0) as total
        FROM extra_grants
        WHERE child_id = ? AND ? >= from_date AND ? <= to_date
    `).get(childId, dateStr, dateStr);
    return row?.total ?? 0;
}

/**
 * Beregn forbrugte timer for et barn i en periode
 * @param {number} childId - Barn ID
 * @param {string} startDate - Start dato (YYYY-MM-DD)
 * @param {string} endDate - Slut dato (YYYY-MM-DD)
 * @param {string} specificWeekday - Valgfri: specifik ugedag at filtrere på
 * @returns {number} - Total timer
 */
export function getUsedHours(childId, startDate, endDate, specificWeekday = null) {
    let query = `
        SELECT COALESCE(SUM(total_hours), 0) as total
        FROM time_entries
        WHERE child_id = ?
        AND date >= ?
        AND date <= ?
        AND status IN ('pending', 'approved')
    `;

    const params = [childId, startDate, endDate];

    // Filtrer på specifik ugedag hvis angivet
    if (specificWeekday !== null) {
        // SQLite's strftime('%w', date) returnerer 0-6 (0 = søndag)
        const weekdayIndex = WEEKDAY_NAMES.indexOf(specificWeekday);
        query += ` AND CAST(strftime('%w', date) AS INTEGER) = ?`;
        params.push(weekdayIndex);
    }

    const result = db.prepare(query).get(...params);
    return result.total || 0;
}

/**
 * Tjek bevilling for et barn på en given dato
 * @param {number} childId - Barn ID
 * @param {string} dateStr - Dato at tjekke (YYYY-MM-DD)
 * @param {number} newHours - Nye timer der skal registreres
 * @returns {Object} - Bevillingsstatus
 */
export function checkGrant(childId, dateStr, newHours = 0) {
    // Hent barn data
    const child = db.prepare(`
        SELECT * FROM children WHERE id = ?
    `).get(childId);

    if (!child) {
        return {
            valid: false,
            error: 'Barn ikke fundet'
        };
    }

    // Hvis rammebevilling er aktiv, brug den i stedet
    if (child.has_frame_grant) {
        return checkFrameGrant(child, dateStr, newHours);
    }

    // Håndter specifikke ugedage
    if (child.grant_type === 'specific_weekdays') {
        return checkSpecificWeekdayGrant(child, dateStr, newHours);
    }

    // Standard bevillingscheck (inkl. ekstrabevilling)
    const extraHours = getExtraGrantHours(childId, dateStr);
    const effectiveGrantHours = child.grant_hours + extraHours;
    const period = getGrantPeriod(child.grant_type, dateStr);
    const usedHours = getUsedHours(childId, period.startDate, period.endDate);
    const totalAfterNew = usedHours + newHours;

    return {
        valid: totalAfterNew <= effectiveGrantHours,
        grantType: child.grant_type,
        grantHours: child.grant_hours,
        extraGrantHours: extraHours,
        effectiveGrantHours,
        usedHours: usedHours,
        remainingHours: Math.max(0, effectiveGrantHours - usedHours),
        newHours: newHours,
        totalAfterNew: totalAfterNew,
        exceeded: totalAfterNew > effectiveGrantHours,
        exceededBy: Math.max(0, totalAfterNew - effectiveGrantHours),
        periodStart: period.startDate,
        periodEnd: period.endDate
    };
}

/**
 * Tjek rammebevilling (årlig, overruler normal bevilling)
 */
function checkFrameGrant(child, dateStr, newHours) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const extraHours = getExtraGrantHours(child.id, dateStr);
    const effectiveGrantHours = child.frame_hours + extraHours;
    const usedHours = getUsedHours(child.id, startDate, endDate);
    const totalAfterNew = usedHours + newHours;

    return {
        valid: totalAfterNew <= effectiveGrantHours,
        grantType: 'frame_grant',
        grantHours: child.frame_hours,
        extraGrantHours: extraHours,
        effectiveGrantHours,
        usedHours: usedHours,
        remainingHours: Math.max(0, effectiveGrantHours - usedHours),
        newHours: newHours,
        totalAfterNew: totalAfterNew,
        exceeded: totalAfterNew > effectiveGrantHours,
        exceededBy: Math.max(0, totalAfterNew - effectiveGrantHours),
        periodStart: startDate,
        periodEnd: endDate,
        isFrameGrant: true
    };
}

/**
 * Tjek bevilling for specifikke ugedage
 */
function checkSpecificWeekdayGrant(child, dateStr, newHours) {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    const weekdayName = WEEKDAY_NAMES[dayOfWeek];

    // Parse ugedags-bevilling
    let weekdayGrants = {};
    try {
        weekdayGrants = JSON.parse(child.grant_weekdays || '{}');
    } catch (e) {
        return {
            valid: false,
            error: 'Ugyldig ugedags-konfiguration'
        };
    }

    // Tjek om denne ugedag er tilladt
    if (!(weekdayName in weekdayGrants) || weekdayGrants[weekdayName] === 0) {
        return {
            valid: false,
            exceeded: true,
            error: `Registrering ikke tilladt på ${translateWeekday(weekdayName)}`,
            grantType: 'specific_weekdays',
            allowedDays: Object.keys(weekdayGrants).filter(d => weekdayGrants[d] > 0).map(translateWeekday)
        };
    }

    // Hent periodens start/slut (ugen)
    const period = getGrantPeriod('specific_weekdays', dateStr);

    // Beregn forbrugte timer for denne specifikke ugedag i denne uge (inkl. ekstrabevilling)
    const extraHours = getExtraGrantHours(child.id, dateStr);
    const effectiveGrantHours = grantHours + extraHours;
    const usedHours = getUsedHours(child.id, period.startDate, period.endDate, weekdayName);
    const totalAfterNew = usedHours + newHours;

    return {
        valid: totalAfterNew <= effectiveGrantHours,
        grantType: 'specific_weekdays',
        weekday: weekdayName,
        weekdayDanish: translateWeekday(weekdayName),
        grantHours: grantHours,
        extraGrantHours: extraHours,
        effectiveGrantHours,
        usedHours: usedHours,
        remainingHours: Math.max(0, effectiveGrantHours - usedHours),
        newHours: newHours,
        totalAfterNew: totalAfterNew,
        exceeded: totalAfterNew > effectiveGrantHours,
        exceededBy: Math.max(0, totalAfterNew - effectiveGrantHours),
        periodStart: period.startDate,
        periodEnd: period.endDate,
        allWeekdayGrants: weekdayGrants
    };
}

function translateWeekday(weekday) {
    const translations = {
        monday: 'Mandag',
        tuesday: 'Tirsdag',
        wednesday: 'Onsdag',
        thursday: 'Torsdag',
        friday: 'Fredag',
        saturday: 'Lørdag',
        sunday: 'Søndag'
    };
    return translations[weekday] || weekday;
}

/**
 * Få samlet bevillingsoversigt for et barn
 */
export function getGrantSummary(childId) {
    const child = db.prepare(`
        SELECT * FROM children WHERE id = ?
    `).get(childId);

    if (!child) {
        return null;
    }

    const today = formatDate(new Date());

    if (child.has_frame_grant) {
        return checkFrameGrant(child, today, 0);
    }

    if (child.grant_type === 'specific_weekdays') {
        // Returner oversigt for alle ugedage
        let weekdayGrants = {};
        try {
            weekdayGrants = JSON.parse(child.grant_weekdays || '{}');
        } catch (e) {
            return null;
        }

        const period = getGrantPeriod('specific_weekdays', today);
        const summary = {
            grantType: 'specific_weekdays',
            periodStart: period.startDate,
            periodEnd: period.endDate,
            weekdays: {}
        };

        for (const [weekday, hours] of Object.entries(weekdayGrants)) {
            if (hours > 0) {
                const usedHours = getUsedHours(childId, period.startDate, period.endDate, weekday);
                summary.weekdays[weekday] = {
                    grantHours: hours,
                    usedHours: usedHours,
                    remainingHours: Math.max(0, hours - usedHours),
                    exceeded: usedHours > hours
                };
            }
        }

        return summary;
    }

    return checkGrant(childId, today, 0);
}
