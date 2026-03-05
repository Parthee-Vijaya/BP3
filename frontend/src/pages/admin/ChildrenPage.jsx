import { useState, useEffect } from 'react';
import { childrenApi, caregiversApi } from '../../utils/api';
import { translateGrantType, translateWeekday, formatDate, padMaNumber } from '../../utils/helpers';

const PlusIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    const [caregiverSearch, setCaregiverSearch] = useState('');

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            const [childrenData, caregiversData] = await Promise.all([
                childrenApi.getAll(), caregiversApi.getAll()
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
            first_name: '', last_name: '', birth_date: '',
            grant_type: 'week', grant_hours: 0, grant_weekdays: {},
            has_frame_grant: false, frame_hours: 0, caregiver_ids: []
        });
        setCaregiverSearch('');
        setEditModal({ open: true, child: null });
    }

    function openEditModal(child) {
        setFormData({
            first_name: child.first_name, last_name: child.last_name,
            birth_date: child.birth_date || '', grant_type: child.grant_type,
            grant_hours: child.grant_hours || 0, grant_weekdays: child.grant_weekdays || {},
            has_frame_grant: !!child.has_frame_grant, frame_hours: child.frame_hours || 0,
            caregiver_ids: child.caregivers?.map(c => c.id) || []
        });
        setCaregiverSearch('');
        setEditModal({ open: true, child });
    }

    async function handleSave() {
        try {
            if (editModal.child) { await childrenApi.update(editModal.child.id, formData); }
            else { await childrenApi.create(formData); }
            setEditModal({ open: false, child: null });
            loadData();
        } catch (error) { alert('Fejl ved gem: ' + error.message); }
    }

    async function handleDelete(id) {
        if (!confirm('Er du sikker på at du vil slette dette barn?')) return;
        try { await childrenApi.delete(id); loadData(); }
        catch (error) { alert('Fejl ved sletning: ' + error.message); }
    }

    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    const filteredChildren = children.filter(child => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return `${child.first_name} ${child.last_name}`.toLowerCase().includes(query);
    });

    const sortedCaregivers = [...caregivers].sort((a, b) =>
        `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, 'da')
    );
    const filteredModalCaregivers = sortedCaregivers.filter(cg => {
        if (!caregiverSearch) return true;
        const q = caregiverSearch.toLowerCase();
        const name = `${cg.first_name} ${cg.last_name}`.toLowerCase();
        return name.includes(q) || padMaNumber(cg.ma_number || '').includes(q);
    });

    function formatBevilling(child) {
        if (child.grant_type === 'specific_weekdays') return 'Pr. ugedag';
        if (!child.grant_hours || child.grant_hours === 0) return 'Ikke sat';
        return `${child.grant_hours} timer/${translateGrantType(child.grant_type).toLowerCase()}`;
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-white rounded-xl px-4 py-2.5 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="text-base font-bold text-gray-900">Børn</h2>
                        <span className="text-xs text-gray-400">{filteredChildren.length} børn</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <SearchIcon />
                            </div>
                            <input
                                type="text"
                                placeholder="Søg barn (navn)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-1.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#B54A32]/20 focus:border-[#B54A32]/30 transition-all w-56"
                            />
                        </div>
                        {!readOnly && (
                            <button
                                onClick={openCreateModal}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#B54A32] to-[#9a3f2b] text-white rounded-lg text-xs font-medium shadow-md hover:shadow-lg transition-all"
                            >
                                <PlusIcon />
                                Opret barn
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-[#B54A32]"></div>
                </div>
            ) : (
                <div className="bg-white rounded-xl overflow-clip shadow-sm border border-gray-200">
                    <table className="w-full">
                        <thead>
                            <tr className="sticky top-[124px] z-10">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Navn</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Fødselsdato</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Bevillingstype</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Bevilling</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Barnepiger</th>
                                {!readOnly && <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Handlinger</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredChildren.map((child) => (
                                <tr key={child.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <span className="font-medium text-sm text-gray-900">{child.first_name} {child.last_name}</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {child.birth_date ? formatDate(child.birth_date) : <span className="text-gray-400">-</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-sm text-gray-600">{translateGrantType(child.grant_type)}</div>
                                        {!!child.has_frame_grant && (
                                            <div className="text-xs text-purple-600 mt-0.5">Rammebevilling</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        <div>{formatBevilling(child)}</div>
                                        {!!child.has_frame_grant && child.frame_hours > 0 && (
                                            <div className="text-xs text-purple-600">{child.frame_hours} timer/år</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {child.caregivers?.map(c => c.name).join(', ') || <span className="text-gray-400 italic">Ingen tilknyttet</span>}
                                    </td>
                                    {!readOnly && (
                                        <td className="px-4 py-3 text-right">
                                            <div className="inline-flex items-center gap-1">
                                                <button onClick={() => openEditModal(child)} className="p-1.5 text-gray-400 hover:text-[#B54A32] hover:bg-gray-100 rounded-lg transition-all" title="Rediger">
                                                    <EditIcon />
                                                </button>
                                                <button onClick={() => handleDelete(child.id)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Slet">
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {children.length === 0 && (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-gray-400"><UserIcon /></div>
                            <h3 className="text-sm font-semibold text-gray-900">Ingen børn oprettet</h3>
                            <p className="text-xs text-gray-500 mt-1">Opret et barn for at komme i gang</p>
                        </div>
                    )}
                    {filteredChildren.length === 0 && children.length > 0 && (
                        <div className="p-12 text-center">
                            <h3 className="text-sm font-semibold text-gray-900">Ingen resultater</h3>
                            <p className="text-xs text-gray-500 mt-1">Prøv at søge efter noget andet</p>
                        </div>
                    )}
                </div>
            )}

            {/* Edit/Create Modal */}
            {editModal.open && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-5 w-full max-w-lg my-8 border border-gray-200">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-[#B54A32] to-[#9a3f2b] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#B54A32]/30">
                                    <UserIcon />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    {editModal.child ? 'Rediger barn' : 'Opret barn'}
                                </h3>
                            </div>
                            <button onClick={() => setEditModal({ open: false, child: null })} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                                <CloseIcon />
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Fornavn *</label>
                                    <input type="text" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-[#B54A32]/20 focus:border-[#B54A32]/30" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Efternavn *</label>
                                    <input type="text" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-[#B54A32]/20 focus:border-[#B54A32]/30" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Fødselsdato</label>
                                <input type="date" value={formData.birth_date} onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-[#B54A32]/20" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Tilknyt barnepiger</label>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="p-2 bg-gray-50 border-b border-gray-200">
                                        <input type="text" placeholder="Søg barnepige (navn eller MA-nr)..." value={caregiverSearch} onChange={(e) => setCaregiverSearch(e.target.value)} className="w-full rounded-md px-2.5 py-1.5 text-sm border border-gray-300 focus:ring-2 focus:ring-[#B54A32]/20" />
                                    </div>
                                    <div className="max-h-36 overflow-y-auto p-1.5">
                                        {filteredModalCaregivers.map((cg) => (
                                            <label key={cg.id} className="flex items-center gap-2.5 py-1.5 px-2 hover:bg-gray-50 rounded-md cursor-pointer text-sm">
                                                <input type="checkbox" checked={formData.caregiver_ids?.includes(cg.id)} onChange={(e) => {
                                                    const ids = formData.caregiver_ids || [];
                                                    setFormData({ ...formData, caregiver_ids: e.target.checked ? [...ids, cg.id] : ids.filter(i => i !== cg.id) });
                                                }} className="rounded border-gray-300 text-[#B54A32] focus:ring-[#B54A32]" />
                                                <span className="text-gray-700">{cg.first_name} {cg.last_name}</span>
                                                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">{padMaNumber(cg.ma_number)}</span>
                                            </label>
                                        ))}
                                        {filteredModalCaregivers.length === 0 && caregivers.length > 0 && (
                                            <div className="text-gray-400 text-xs py-2 text-center">Ingen match</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Bevilling */}
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Bevillingstype</label>
                                <select value={formData.grant_type} onChange={(e) => setFormData({ ...formData, grant_type: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-[#B54A32]/20 mb-2">
                                    <option value="week">Uge</option>
                                    <option value="month">Måned</option>
                                    <option value="quarter">Kvartal</option>
                                    <option value="half_year">Halvår</option>
                                    <option value="year">År</option>
                                    <option value="specific_weekdays">Specifikke ugedage</option>
                                </select>

                                {formData.grant_type === 'specific_weekdays' ? (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Timer pr. ugedag</label>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {weekdays.map((day) => (
                                                <div key={day} className="flex items-center gap-2 p-1.5 bg-white rounded-md border border-gray-200">
                                                    <input type="checkbox" checked={(formData.grant_weekdays?.[day] || 0) > 0} onChange={(e) => {
                                                        const wd = { ...formData.grant_weekdays };
                                                        wd[day] = e.target.checked ? (wd[day] || 2) : 0;
                                                        setFormData({ ...formData, grant_weekdays: wd });
                                                    }} className="rounded border-gray-300 text-[#B54A32] focus:ring-[#B54A32]" />
                                                    <span className="w-12 text-xs font-medium text-gray-700">{translateWeekday(day)}</span>
                                                    <input type="text" inputMode="decimal" value={formData.grant_weekdays?.[day] || ''} onChange={(e) => {
                                                        const value = e.target.value;
                                                        if (value === '' || /^[0-9]*[.,]?[0-9]*$/.test(value)) {
                                                            const wd = { ...formData.grant_weekdays };
                                                            wd[day] = value;
                                                            setFormData({ ...formData, grant_weekdays: wd });
                                                        }
                                                    }} onBlur={(e) => {
                                                        const wd = { ...formData.grant_weekdays };
                                                        wd[day] = parseFloat(e.target.value.replace(',', '.')) || 0;
                                                        setFormData({ ...formData, grant_weekdays: wd });
                                                    }} placeholder="0" className="w-14 rounded-md px-2 py-1 text-xs border border-gray-300" />
                                                    <span className="text-[10px] text-gray-400">t</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Timer pr. {translateGrantType(formData.grant_type).toLowerCase()}</label>
                                        <input type="text" inputMode="decimal" value={formData.grant_hours} onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '' || /^[0-9]*[.,]?[0-9]*$/.test(value)) setFormData({ ...formData, grant_hours: value });
                                        }} onBlur={(e) => setFormData({ ...formData, grant_hours: parseFloat(e.target.value.replace(',', '.')) || 0 })} placeholder="0" className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-[#B54A32]/20" />
                                    </div>
                                )}
                            </div>

                            {/* Rammebevilling */}
                            <div className={`p-3 rounded-lg border ${formData.has_frame_grant ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
                                <label className="flex items-center gap-2.5 cursor-pointer">
                                    <input type="checkbox" checked={formData.has_frame_grant} onChange={(e) => setFormData({ ...formData, has_frame_grant: e.target.checked })} className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                                    <div>
                                        <span className="text-xs font-semibold text-gray-700">Rammebevilling</span>
                                        <p className="text-[10px] text-gray-500">Årlig ramme ud over normal bevilling</p>
                                    </div>
                                </label>
                                {formData.has_frame_grant && (
                                    <div className="mt-2">
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Timer pr. år</label>
                                        <input type="text" inputMode="decimal" value={formData.frame_hours} onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '' || /^[0-9]*[.,]?[0-9]*$/.test(value)) setFormData({ ...formData, frame_hours: value });
                                        }} onBlur={(e) => setFormData({ ...formData, frame_hours: parseFloat(e.target.value.replace(',', '.')) || 0 })} placeholder="0" className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-purple-500/20" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-200">
                            <button onClick={handleSave} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#B54A32] to-[#9a3f2b] text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all">Gem</button>
                            <button onClick={() => setEditModal({ open: false, child: null })} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm transition-all">Annuller</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
