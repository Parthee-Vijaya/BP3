import { useState, useEffect } from 'react';
import { timeEntriesApi } from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, formatHours } from '../../utils/helpers';

// Icons
const ClockIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const CheckIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const XIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const DocumentIcon = () => (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

export default function MyTimeEntries({ caregiverId = 1 }) {
    const [entries, setEntries] = useState([]);
    const [activeTab, setActiveTab] = useState('pending');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEntries();
    }, [activeTab, caregiverId]);

    async function loadEntries() {
        setLoading(true);
        try {
            const data = await timeEntriesApi.getAll({
                caregiver_id: caregiverId,
                status: activeTab
            });
            setEntries(data);
        } catch (error) {
            console.error('Fejl ved indlæsning:', error);
        } finally {
            setLoading(false);
        }
    }

    const tabs = [
        { id: 'pending', label: 'Afventer', icon: <ClockIcon />, color: 'amber' },
        { id: 'approved', label: 'Godkendt', icon: <CheckIcon />, color: 'emerald' },
        { id: 'rejected', label: 'Afvist', icon: <XIcon />, color: 'rose' }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="glass-card rounded-2xl p-6 animate-fade-in-up">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#B54A32] to-[#9a3f2b] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#B54A32]/30">
                        <ClockIcon />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Mine registreringer</h2>
                        <p className="text-gray-500 mt-0.5">Se status på dine indberettede timer</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="glass-card rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="border-b border-white/20 flex bg-white/30">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all ${
                                activeTab === tab.id
                                    ? 'border-[#B54A32] text-[#B54A32] bg-white/50'
                                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-white/30'
                            }`}
                        >
                            <span className={activeTab === tab.id ? 'text-[#B54A32]' : 'text-gray-400'}>
                                {tab.icon}
                            </span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/30 border-t-[#B54A32] mx-auto"></div>
                        <p className="text-gray-500 mt-4">Indlæser...</p>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-5 text-gray-400 shadow-inner">
                            <DocumentIcon />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Ingen registreringer</h3>
                        <p className="text-gray-500 mt-1">Ingen registreringer i denne kategori</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/20">
                        {entries.map((entry, index) => (
                            <div
                                key={entry.id}
                                className="p-5 hover:bg-white/30 transition-all duration-200 animate-fade-in-up"
                                style={{ animationDelay: `${0.2 + index * 0.05}s` }}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-[#B54A32] to-[#9a3f2b] rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-[#B54A32]/20">
                                            {entry.child_first_name?.charAt(0)}{entry.child_last_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">
                                                {entry.child_first_name} {entry.child_last_name}
                                            </div>
                                            <div className="text-sm text-gray-500 mt-1">
                                                {formatDate(entry.date)} • {entry.start_time} - {entry.end_time}
                                            </div>
                                            {entry.comment && (
                                                <div className="text-sm text-gray-500 mt-2 italic bg-white/30 px-3 py-1.5 rounded-lg border border-white/30">
                                                    "{entry.comment}"
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right flex-shrink-0">
                                        <StatusBadge status={entry.status} />
                                        <div className="text-xl font-bold text-gray-900 mt-2">
                                            {formatHours(entry.total_hours)} timer
                                        </div>
                                    </div>
                                </div>

                                {/* Timer breakdown */}
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {entry.normal_hours > 0 && (
                                        <span className="text-xs px-2.5 py-1 bg-white/40 rounded-lg border border-white/30 text-gray-600">
                                            Normal: {formatHours(entry.normal_hours)}
                                        </span>
                                    )}
                                    {entry.evening_hours > 0 && (
                                        <span className="text-xs px-2.5 py-1 bg-white/40 rounded-lg border border-white/30 text-gray-600">
                                            Aften: {formatHours(entry.evening_hours)}
                                        </span>
                                    )}
                                    {entry.night_hours > 0 && (
                                        <span className="text-xs px-2.5 py-1 bg-white/40 rounded-lg border border-white/30 text-gray-600">
                                            Nat: {formatHours(entry.night_hours)}
                                        </span>
                                    )}
                                    {entry.saturday_hours > 0 && (
                                        <span className="text-xs px-2.5 py-1 bg-white/40 rounded-lg border border-white/30 text-gray-600">
                                            Lørdag: {formatHours(entry.saturday_hours)}
                                        </span>
                                    )}
                                    {entry.sunday_holiday_hours > 0 && (
                                        <span className="text-xs px-2.5 py-1 bg-white/40 rounded-lg border border-white/30 text-gray-600">
                                            Søn/Hellig: {formatHours(entry.sunday_holiday_hours)}
                                        </span>
                                    )}
                                </div>

                                {/* Rejection reason */}
                                {entry.status === 'rejected' && entry.rejection_reason && (
                                    <div className="mt-4 p-4 bg-rose-500/10 rounded-xl border border-rose-500/20 backdrop-blur-sm">
                                        <div className="text-sm font-bold text-rose-700 flex items-center gap-2">
                                            <XIcon />
                                            Årsag til afvisning:
                                        </div>
                                        <div className="text-sm text-rose-600 mt-1">{entry.rejection_reason}</div>
                                        <div className="text-xs text-rose-500 mt-2">
                                            Afvist af {entry.reviewed_by} • {formatDate(entry.reviewed_at)}
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-rose-500/20 text-xs text-gray-500">
                                            Bemærk: Afviste registreringer kan ikke rettes. Opret en ny registrering i stedet.
                                        </div>
                                    </div>
                                )}

                                {/* Approved info */}
                                {entry.status === 'approved' && (
                                    <div className="mt-4 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 backdrop-blur-sm">
                                        <div className="text-sm text-emerald-700 flex items-center gap-2">
                                            <CheckIcon />
                                            <span className="font-semibold">Godkendt af {entry.reviewed_by}</span>
                                            {entry.payroll_date && (
                                                <span className="text-emerald-600">• Data sendt: {new Date(entry.payroll_date).toLocaleString('da-DK', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
