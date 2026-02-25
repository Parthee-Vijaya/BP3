import { useState, useEffect } from 'react';
import { childrenApi, caregiversApi, extraGrantsApi } from '../../utils/api';
import GrantStatusBadge from '../../components/GrantStatusBadge';
import { translateGrantType, translateWeekday, formatDate, padMaNumber } from '../../utils/helpers';

// Icons
const PlusIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const EditIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const UserIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const SearchIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const CloseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export default function ChildrenPage({ readOnly = false }) {
    const [children, setChildren] = useState([]);
    const [caregivers, setCaregivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editModal, setEditModal] = useState({ open: false, child: null });
    const [formData, setFormData] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [extraGrantsModal, setExtraGrantsModal] = useState({ open: false, child: null });
    const [extraGrantsList, setExtraGrantsList] = useState([]);
    const [extraGrantForm, setExtraGrantForm] = useState({ hours: '', from_date: '', to_date: '', comment: '' });
    const [editingExtraId, setEditingExtraId] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [childrenData, caregiversData] = await Promise.all([
                childrenApi.getAll(),
                caregiversApi.getAll()
            ]);
            setChildren(childrenData);
            setCaregivers(caregiversData);
        } catch (error) {
            console.error('Fejl ved indlæsning:', error);
        } finally {
            setLoading(false);
        }
    }

    function openCreateModal() {
        setFormData({
            first_name: '',
            last_name: '',
            birth_date: '',
            grant_type: 'week',
            grant_hours: 0,
            grant_weekdays: {},
            has_frame_grant: false,
            frame_hours: 0,
            caregiver_ids: []
        });
        setEditModal({ open: true, child: null });
    }

    function openEditModal(child) {
        setFormData({
            first_name: child.first_name,
            last_name: child.last_name,
            birth_date: child.birth_date || '',
            grant_type: child.grant_type,
            grant_hours: child.grant_hours || 0,
            grant_weekdays: child.grant_weekdays || {},
            has_frame_grant: !!child.has_frame_grant,
            frame_hours: child.frame_hours || 0,
            caregiver_ids: child.caregivers?.map(c => c.id) || []
        });
        setEditModal({ open: true, child });
    }

    async function handleSave() {
        try {
            if (editModal.child) {
                await childrenApi.update(editModal.child.id, formData);
            } else {
                await childrenApi.create(formData);
            }
            setEditModal({ open: false, child: null });
            loadData();
        } catch (error) {
            alert('Fejl ved gem: ' + error.message);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Er du sikker på at du vil slette dette barn?')) return;

        try {
            await childrenApi.delete(id);
            loadData();
        } catch (error) {
            alert('Fejl ved sletning: ' + error.message);
        }
    }

    async function openExtraGrantsModal(child) {
        setExtraGrantsModal({ open: true, child });
        setExtraGrantForm({ hours: '', from_date: '', to_date: '', comment: '' });
        setEditingExtraId(null);
        try {
            const list = await extraGrantsApi.getAll(child.id);
            setExtraGrantsList(list);
        } catch (e) {
            setExtraGrantsList([]);
        }
    }

    async function saveExtraGrant() {
        if (!extraGrantsModal.child) return;
        const { hours, from_date, to_date, comment } = extraGrantForm;
        if (!hours || !from_date || !to_date) {
            alert('Udfyld timer, fra-dato og til-dato');
            return;
        }
        try {
            if (editingExtraId) {
                await extraGrantsApi.update(editingExtraId, { hours: Number(hours), from_date, to_date, comment });
            } else {
                await extraGrantsApi.create({ child_id: extraGrantsModal.child.id, hours: Number(hours), from_date, to_date, comment });
            }
            setExtraGrantForm({ hours: '', from_date: '', to_date: '', comment: '' });
            setEditingExtraId(null);
            const list = await extraGrantsApi.getAll(extraGrantsModal.child.id);
            setExtraGrantsList(list);
        } catch (e) {
            alert('Fejl: ' + e.message);
        }
    }

    async function deleteExtraGrant(id) {
        if (!confirm('Slet denne ekstrabevilling?')) return;
        try {
            await extraGrantsApi.delete(id);
            const list = await extraGrantsApi.getAll(extraGrantsModal.child.id);
            setExtraGrantsList(list);
        } catch (e) {
            alert('Fejl: ' + e.message);
        }
    }

    function startEditExtra(eg) {
        setExtraGrantForm({
            hours: String(eg.hours),
            from_date: eg.from_date,
            to_date: eg.to_date,
            comment: eg.comment || ''
        });
        setEditingExtraId(eg.id);
    }

    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    // Filtrér børn baseret på søgning
    const filteredChildren = children.filter(child => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const fullName = `${child.first_name} ${child.last_name}`.toLowerCase();
        return fullName.includes(query);
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="glass-card rounded-2xl p-6 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Børn</h2>
                        <p className="text-gray-500 mt-1">{readOnly ? 'Oversigt over børn og bevillinger' : 'Administrer børn og deres bevillinger'}</p>
                    </div>
                    {!readOnly && (
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-2 px-5 py-2.5 btn-kalundborg rounded-xl font-medium"
                        >
                            <PlusIcon />
                            Opret barn
                        </button>
                    )}
                </div>
            </div>

            {/* Søgefelt */}
            <div className="glass-card rounded-2xl p-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="relative w-full sm:w-80">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        placeholder="Søg barn (navn)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="glass-input pl-10 pr-4 py-2.5 rounded-xl text-sm w-full"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/30 border-t-[#B54A32]"></div>
                </div>
            ) : (
                <div className="glass-card rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-white/40 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    <th className="px-5 py-4">Navn</th>
                                    <th className="px-5 py-4">Fødselsdato</th>
                                    <th className="px-5 py-4">Bevillingstype</th>
                                    <th className="px-5 py-4">Bevilling</th>
                                    <th className="px-5 py-4">Barnepiger</th>
                                    {!readOnly && <th className="px-5 py-4">Handlinger</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/20">
                                {filteredChildren.map((child, index) => (
                                    <tr
                                        key={child.id}
                                        className="hover:bg-white/30 transition-all duration-200"
                                        style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-[#B54A32] to-[#9a3f2b] rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-[#B54A32]/20">
                                                    {child.first_name?.charAt(0)}{child.last_name?.charAt(0)}
                                                </div>
                                                <span className="font-semibold text-gray-900">{child.first_name} {child.last_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-600">
                                            {child.birth_date ? formatDate(child.birth_date) : '-'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="space-y-1">
                                                <span className="text-sm text-gray-600">{translateGrantType(child.grant_type)}</span>
                                                {child.has_frame_grant && (
                                                    <span className="block inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/15 text-purple-700 border border-purple-500/20 backdrop-blur-sm">
                                                        + Rammebevilling
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-600">
                                            <div className="space-y-1">
                                                <div>
                                                    {child.grant_type === 'specific_weekdays'
                                                        ? 'Pr. ugedag'
                                                        : `${child.grant_hours} timer/${translateGrantType(child.grant_type).toLowerCase()}`}
                                                </div>
                                                {child.has_frame_grant && (
                                                    <div className="text-purple-600 font-medium">
                                                        {child.frame_hours} timer/år (ramme)
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-500">
                                            {child.caregivers?.map(c => c.name).join(', ') || '-'}
                                        </td>
                                        {!readOnly && (
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => openExtraGrantsModal(child)}
                                                        className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-500/10 rounded-lg transition-all duration-200 text-xs font-medium"
                                                        title="Ekstrabevillinger"
                                                    >
                                                        Ekstra
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(child)}
                                                        className="p-2 text-gray-500 hover:text-[#B54A32] hover:bg-white/50 rounded-lg transition-all duration-200"
                                                        title="Rediger"
                                                    >
                                                        <EditIcon />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(child.id)}
                                                        className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-all duration-200"
                                                        title="Slet"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {children.length === 0 && (
                        <div className="p-12 text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-5 text-gray-400 shadow-inner">
                                <UserIcon />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Ingen børn oprettet</h3>
                            <p className="text-gray-500 mt-1">Opret et barn for at komme i gang</p>
                        </div>
                    )}

                    {filteredChildren.length === 0 && children.length > 0 && (
                        <div className="p-12 text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-5 text-gray-400 shadow-inner">
                                <SearchIcon />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Ingen resultater</h3>
                            <p className="text-gray-500 mt-1">Prøv at søge efter noget andet</p>
                        </div>
                    )}
                </div>
            )}

            {/* Edit/Create Modal */}
            {editModal.open && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4">
                    <div className="glass-card-strong rounded-2xl shadow-2xl p-6 w-full max-w-2xl my-8 animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-[#B54A32] to-[#9a3f2b] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#B54A32]/30">
                                    <UserIcon />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    {editModal.child ? 'Rediger barn' : 'Opret barn'}
                                </h3>
                            </div>
                            <button
                                onClick={() => setEditModal({ open: false, child: null })}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-all"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-2">
                            {/* Basic info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Fornavn *</label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="glass-input w-full rounded-xl px-4 py-2.5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Efternavn *</label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        className="glass-input w-full rounded-xl px-4 py-2.5"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Fødselsdato</label>
                                <input
                                    type="date"
                                    value={formData.birth_date}
                                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                                    className="glass-input w-full rounded-xl px-4 py-2.5"
                                />
                            </div>

                            {/* Barnepiger */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Tilknyttede barnepiger</label>
                                <div className="glass-card rounded-xl p-3 max-h-32 overflow-y-auto">
                                    {caregivers.map((cg) => (
                                        <label key={cg.id} className="flex items-center gap-3 py-2 px-2 hover:bg-white/50 rounded-lg cursor-pointer transition-all">
                                            <input
                                                type="checkbox"
                                                checked={formData.caregiver_ids?.includes(cg.id)}
                                                onChange={(e) => {
                                                    const ids = formData.caregiver_ids || [];
                                                    if (e.target.checked) {
                                                        setFormData({ ...formData, caregiver_ids: [...ids, cg.id] });
                                                    } else {
                                                        setFormData({ ...formData, caregiver_ids: ids.filter(i => i !== cg.id) });
                                                    }
                                                }}
                                                className="rounded border-gray-300 text-[#B54A32] focus:ring-[#B54A32]"
                                            />
                                            <span className="text-sm font-medium text-gray-700">{cg.first_name} {cg.last_name}</span>
                                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-mono">{padMaNumber(cg.ma_number)}</span>
                                        </label>
                                    ))}
                                    {caregivers.length === 0 && (
                                        <div className="text-gray-400 text-sm py-3 text-center">Ingen barnepiger oprettet</div>
                                    )}
                                </div>
                            </div>

                            {/* Normal bevilling */}
                            <div className="p-4 bg-white/30 rounded-xl border border-white/30 backdrop-blur-sm">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Bevillingstype</label>
                                <select
                                    value={formData.grant_type}
                                    onChange={(e) => setFormData({ ...formData, grant_type: e.target.value })}
                                    className="glass-input w-full rounded-xl px-4 py-2.5 mb-4"
                                >
                                    <option value="week">Uge</option>
                                    <option value="month">Måned</option>
                                    <option value="quarter">Kvartal</option>
                                    <option value="half_year">Halvår</option>
                                    <option value="year">År</option>
                                    <option value="specific_weekdays">Specifikke ugedage</option>
                                </select>

                                {formData.grant_type === 'specific_weekdays' ? (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Timer pr. ugedag</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {weekdays.map((day) => (
                                                <div key={day} className="flex items-center gap-2 p-2.5 bg-white/50 rounded-lg border border-white/30">
                                                    <input
                                                        type="checkbox"
                                                        checked={(formData.grant_weekdays?.[day] || 0) > 0}
                                                        onChange={(e) => {
                                                            const weekdays = { ...formData.grant_weekdays };
                                                            if (e.target.checked) {
                                                                weekdays[day] = weekdays[day] || 2;
                                                            } else {
                                                                weekdays[day] = 0;
                                                            }
                                                            setFormData({ ...formData, grant_weekdays: weekdays });
                                                        }}
                                                        className="rounded border-gray-300 text-[#B54A32] focus:ring-[#B54A32]"
                                                    />
                                                    <span className="w-16 text-sm font-medium text-gray-700">{translateWeekday(day)}:</span>
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={formData.grant_weekdays?.[day] || ''}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            // Tillad kun tal og komma/punktum
                                                            if (value === '' || /^[0-9]*[.,]?[0-9]*$/.test(value)) {
                                                                const weekdays = { ...formData.grant_weekdays };
                                                                weekdays[day] = value;
                                                                setFormData({ ...formData, grant_weekdays: weekdays });
                                                            }
                                                        }}
                                                        onBlur={(e) => {
                                                            // Konverter til tal ved blur
                                                            const weekdays = { ...formData.grant_weekdays };
                                                            weekdays[day] = parseFloat(e.target.value.replace(',', '.')) || 0;
                                                            setFormData({ ...formData, grant_weekdays: weekdays });
                                                        }}
                                                        placeholder="0"
                                                        className="w-16 glass-input rounded-lg px-2 py-1 text-sm"
                                                    />
                                                    <span className="text-xs text-gray-400">timer</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Bevilling (timer pr. {translateGrantType(formData.grant_type).toLowerCase()})
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={formData.grant_hours}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                // Tillad kun tal og komma/punktum
                                                if (value === '' || /^[0-9]*[.,]?[0-9]*$/.test(value)) {
                                                    setFormData({ ...formData, grant_hours: value });
                                                }
                                            }}
                                            onBlur={(e) => {
                                                // Konverter til tal ved blur
                                                setFormData({ ...formData, grant_hours: parseFloat(e.target.value.replace(',', '.')) || 0 });
                                            }}
                                            placeholder="0"
                                            className="glass-input w-full rounded-xl px-4 py-2.5"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Rammebevilling - separat sektion */}
                            <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20 backdrop-blur-sm">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.has_frame_grant}
                                        onChange={(e) => setFormData({ ...formData, has_frame_grant: e.target.checked })}
                                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    />
                                    <div>
                                        <span className="font-semibold text-purple-700">Rammebevilling</span>
                                        <p className="text-xs text-purple-600/70 mt-0.5">Årlig ramme ud over normal bevillingstype</p>
                                    </div>
                                </label>
                                {formData.has_frame_grant && (
                                    <div className="mt-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Rammebevilling (timer pr. år)</label>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={formData.frame_hours}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                // Tillad kun tal og komma/punktum
                                                if (value === '' || /^[0-9]*[.,]?[0-9]*$/.test(value)) {
                                                    setFormData({ ...formData, frame_hours: value });
                                                }
                                            }}
                                            onBlur={(e) => {
                                                // Konverter til tal ved blur
                                                setFormData({ ...formData, frame_hours: parseFloat(e.target.value.replace(',', '.')) || 0 });
                                            }}
                                            placeholder="0"
                                            className="glass-input w-full rounded-xl px-4 py-2.5"
                                        />
                                        <p className="text-xs text-purple-600/70 mt-2">Rammebevilling overruler den normale bevillingstype når aktiveret</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6 pt-5 border-t border-white/20">
                            <button
                                onClick={handleSave}
                                className="flex-1 px-5 py-3 btn-kalundborg rounded-xl font-semibold"
                            >
                                Gem
                            </button>
                            <button
                                onClick={() => setEditModal({ open: false, child: null })}
                                className="flex-1 px-5 py-3 bg-white/50 hover:bg-white/70 text-gray-700 rounded-xl font-semibold transition-all border border-white/30"
                            >
                                Annuller
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Ekstrabevillinger modal */}
            {extraGrantsModal.open && extraGrantsModal.child && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4">
                    <div className="glass-card-strong rounded-2xl shadow-2xl p-6 w-full max-w-lg my-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">
                                Ekstrabevillinger – {extraGrantsModal.child.first_name} {extraGrantsModal.child.last_name}
                            </h3>
                            <button
                                onClick={() => setExtraGrantsModal({ open: false, child: null })}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">Ekstrabevilling lægges oven i den almindelige bevilling. Ændringer gælder fra d.d. og frem.</p>
                        <div className="space-y-3 mb-4">
                            <div className="grid grid-cols-3 gap-2">
                                <input
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    placeholder="Timer"
                                    value={extraGrantForm.hours}
                                    onChange={(e) => setExtraGrantForm({ ...extraGrantForm, hours: e.target.value })}
                                    className="glass-input rounded-lg px-3 py-2 text-sm"
                                />
                                <input
                                    type="date"
                                    placeholder="Fra"
                                    value={extraGrantForm.from_date}
                                    onChange={(e) => setExtraGrantForm({ ...extraGrantForm, from_date: e.target.value })}
                                    className="glass-input rounded-lg px-3 py-2 text-sm"
                                />
                                <input
                                    type="date"
                                    placeholder="Til"
                                    value={extraGrantForm.to_date}
                                    onChange={(e) => setExtraGrantForm({ ...extraGrantForm, to_date: e.target.value })}
                                    className="glass-input rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="Kommentar (valgfri)"
                                value={extraGrantForm.comment}
                                onChange={(e) => setExtraGrantForm({ ...extraGrantForm, comment: e.target.value })}
                                className="glass-input w-full rounded-lg px-3 py-2 text-sm"
                            />
                            <div className="flex gap-2">
                                <button onClick={saveExtraGrant} className="px-4 py-2 bg-[#B54A32] text-white rounded-lg text-sm font-medium">
                                    {editingExtraId ? 'Gem ændring' : 'Tilføj'}
                                </button>
                                {editingExtraId && (
                                    <button onClick={() => { setEditingExtraId(null); setExtraGrantForm({ hours: '', from_date: '', to_date: '', comment: '' }); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">
                                        Annuller
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="border-t border-white/20 pt-3">
                            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Nuværende ekstrabevillinger</div>
                            {extraGrantsList.length === 0 ? (
                                <p className="text-sm text-gray-500">Ingen ekstrabevillinger</p>
                            ) : (
                                <ul className="space-y-2">
                                    {extraGrantsList.map((eg) => (
                                        <li key={eg.id} className="flex items-center justify-between py-2 px-3 bg-white/30 rounded-lg text-sm">
                                            <span>{eg.hours} t, {formatDate(eg.from_date)} – {formatDate(eg.to_date)}{eg.comment ? ` (${eg.comment})` : ''}</span>
                                            <div className="flex gap-1">
                                                <button onClick={() => startEditExtra(eg)} className="p-1 text-gray-500 hover:text-[#B54A32]">Rediger</button>
                                                <button onClick={() => deleteExtraGrant(eg.id)} className="p-1 text-gray-500 hover:text-rose-600">Slet</button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
