import { useState, useEffect } from 'react';
import { caregiversApi, childrenApi } from '../../utils/api';
import { padMaNumber } from '../../utils/helpers';

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
const UsersIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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

function validateMaNumber(value) {
    if (!value) return { valid: false, error: 'MA-nummer er påkrævet' };
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 0) return { valid: false, error: 'MA-nummer skal kun indeholde tal' };
    if (cleaned.length !== 8) return { valid: false, error: 'MA-nummer skal være præcis 8 cifre' };
    return { valid: true, error: '' };
}

function formatMaNumber(value) {
    return value.replace(/\D/g, '').slice(0, 8);
}

export default function CaregiversPage({ readOnly = false }) {
    const [caregivers, setCaregivers] = useState([]);
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editModal, setEditModal] = useState({ open: false, caregiver: null });
    const [formData, setFormData] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [maError, setMaError] = useState('');
    const [childSearch, setChildSearch] = useState('');

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            const [caregiversData, childrenData] = await Promise.all([
                caregiversApi.getAll(), childrenApi.getAll()
            ]);
            setCaregivers(caregiversData);
            setChildren(childrenData);
        } catch (error) {
            console.error('Fejl ved indlæsning:', error);
        } finally {
            setLoading(false);
        }
    }

    function openCreateModal() {
        setFormData({ first_name: '', last_name: '', ma_number: '', child_ids: [] });
        setMaError('');
        setChildSearch('');
        setEditModal({ open: true, caregiver: null });
    }

    function openEditModal(caregiver) {
        setFormData({
            first_name: caregiver.first_name,
            last_name: caregiver.last_name,
            ma_number: caregiver.ma_number,
            child_ids: caregiver.children?.map(c => c.id) || []
        });
        setMaError('');
        setChildSearch('');
        setEditModal({ open: true, caregiver });
    }

    async function handleSave() {
        const maValidation = validateMaNumber(formData.ma_number);
        if (!maValidation.valid) { setMaError(maValidation.error); return; }
        const dataToSave = { ...formData, ma_number: padMaNumber(formData.ma_number) };
        try {
            if (editModal.caregiver) {
                await caregiversApi.update(editModal.caregiver.id, dataToSave);
            } else {
                await caregiversApi.create(dataToSave);
            }
            setEditModal({ open: false, caregiver: null });
            loadData();
        } catch (error) { alert('Fejl ved gem: ' + error.message); }
    }

    async function handleDelete(id) {
        if (!confirm('Er du sikker på at du vil slette denne barnepige?')) return;
        try { await caregiversApi.delete(id); loadData(); }
        catch (error) { alert('Fejl ved sletning: ' + error.message); }
    }

    const filteredCaregivers = caregivers.filter(cg => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const fullName = `${cg.first_name} ${cg.last_name}`.toLowerCase();
        const maNumber = (cg.ma_number || '').toLowerCase();
        return fullName.includes(query) || maNumber.includes(query);
    });

    const sortedChildren = [...children].sort((a, b) =>
        `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, 'da')
    );
    const filteredModalChildren = sortedChildren.filter(child => {
        if (!childSearch) return true;
        const q = childSearch.toLowerCase();
        return `${child.first_name} ${child.last_name}`.toLowerCase().includes(q);
    });

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-white rounded-xl px-4 py-2.5 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="text-base font-bold text-gray-900">Barnepiger</h2>
                        <span className="text-xs text-gray-400">{filteredCaregivers.length} barnepiger</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <SearchIcon />
                            </div>
                            <input
                                type="text"
                                placeholder="Søg navn eller MA-nr..."
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
                                Opret barnepige
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
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50 border-b border-gray-200">MA-nummer</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Tilknyttede børn</th>
                                {!readOnly && <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Handlinger</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredCaregivers.map((caregiver) => (
                                <tr key={caregiver.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <span className="font-medium text-sm text-gray-900">{caregiver.first_name} {caregiver.last_name}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                            {padMaNumber(caregiver.ma_number || '')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {caregiver.children?.length > 0
                                            ? caregiver.children.map(c => c.name).join(', ')
                                            : <span className="text-gray-400 italic">Ingen tilknyttet</span>
                                        }
                                    </td>
                                    {!readOnly && (
                                        <td className="px-4 py-3 text-right">
                                            <div className="inline-flex items-center gap-1">
                                                <button onClick={() => openEditModal(caregiver)} className="p-1.5 text-gray-400 hover:text-[#B54A32] hover:bg-gray-100 rounded-lg transition-all" title="Rediger">
                                                    <EditIcon />
                                                </button>
                                                <button onClick={() => handleDelete(caregiver.id)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Slet">
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {caregivers.length === 0 && (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-gray-400"><UsersIcon /></div>
                            <h3 className="text-sm font-semibold text-gray-900">Ingen barnepiger oprettet</h3>
                            <p className="text-xs text-gray-500 mt-1">Opret en barnepige for at komme i gang</p>
                        </div>
                    )}
                    {filteredCaregivers.length === 0 && caregivers.length > 0 && (
                        <div className="p-12 text-center">
                            <h3 className="text-sm font-semibold text-gray-900">Ingen resultater</h3>
                            <p className="text-xs text-gray-500 mt-1">Prøv at søge efter noget andet</p>
                        </div>
                    )}
                </div>
            )}

            {/* Edit/Create Modal */}
            {editModal.open && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-5 w-full max-w-md border border-gray-200">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-500/30">
                                    <UsersIcon />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    {editModal.caregiver ? 'Rediger barnepige' : 'Opret barnepige'}
                                </h3>
                            </div>
                            <button onClick={() => setEditModal({ open: false, caregiver: null })} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                                <CloseIcon />
                            </button>
                        </div>

                        <div className="space-y-4">
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
                                <label className="block text-xs font-semibold text-gray-700 mb-1">MA-nummer * (8 cifre)</label>
                                <input
                                    type="text" inputMode="numeric" pattern="[0-9]*"
                                    value={formData.ma_number}
                                    onChange={(e) => {
                                        const formatted = formatMaNumber(e.target.value);
                                        setFormData({ ...formData, ma_number: formatted });
                                        const validation = validateMaNumber(formatted);
                                        setMaError(validation.valid ? '' : validation.error);
                                    }}
                                    placeholder="12345678" maxLength={8}
                                    className={`w-full rounded-lg px-3 py-2 text-sm font-mono border focus:ring-2 focus:ring-[#B54A32]/20 ${maError ? 'border-red-400' : 'border-gray-300'}`}
                                />
                                {maError && <p className="mt-1 text-xs text-red-600">{maError}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Tilknyt børn</label>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="p-2 bg-gray-50 border-b border-gray-200">
                                        <input type="text" placeholder="Søg barn..." value={childSearch} onChange={(e) => setChildSearch(e.target.value)} className="w-full rounded-md px-2.5 py-1.5 text-sm border border-gray-300 focus:ring-2 focus:ring-[#B54A32]/20" />
                                    </div>
                                    <div className="max-h-40 overflow-y-auto p-1.5">
                                        {filteredModalChildren.map((child) => (
                                            <label key={child.id} className="flex items-center gap-2.5 py-1.5 px-2 hover:bg-gray-50 rounded-md cursor-pointer text-sm">
                                                <input type="checkbox" checked={formData.child_ids?.includes(child.id)} onChange={(e) => {
                                                    const ids = formData.child_ids || [];
                                                    setFormData({ ...formData, child_ids: e.target.checked ? [...ids, child.id] : ids.filter(i => i !== child.id) });
                                                }} className="rounded border-gray-300 text-[#B54A32] focus:ring-[#B54A32]" />
                                                <span className="text-gray-700">{child.first_name} {child.last_name}</span>
                                            </label>
                                        ))}
                                        {filteredModalChildren.length === 0 && <div className="text-gray-400 text-xs py-2 text-center">Ingen match</div>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-200">
                            <button onClick={handleSave} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#B54A32] to-[#9a3f2b] text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all">Gem</button>
                            <button onClick={() => setEditModal({ open: false, caregiver: null })} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm transition-all">Annuller</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
