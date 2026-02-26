import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { childrenApi, caregiversApi } from '../../utils/api';
import GrantStatusBadge from '../../components/GrantStatusBadge';
import { translateGrantType, translateWeekday } from '../../utils/helpers';

// Icons
const PlusIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const ArrowIcon = () => (
    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

const UserIcon = () => (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const ClockIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export default function CaregiverDashboard({ caregiverId = 1 }) {
    const [children, setChildren] = useState([]);
    const [caregiver, setCaregiver] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [caregiverId]);

    async function loadData() {
        try {
            const caregiverData = await caregiversApi.getById(caregiverId);
            setCaregiver(caregiverData);

            if (caregiverData.children && caregiverData.children.length > 0) {
                const childrenDetails = await Promise.all(
                    caregiverData.children.map(child => childrenApi.getById(child.id))
                );
                setChildren(childrenDetails);
            } else {
                setChildren([]);
            }
        } catch (error) {
            console.error('Fejl ved indlæsning:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/30 border-t-[#B54A32]"></div>
            </div>
        );
    }

    if (!caregiver) {
        return (
            <div className="glass-card rounded-2xl p-12 text-center animate-fade-in-up">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-5 text-gray-400 shadow-inner">
                    <UserIcon />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Barnepige ikke fundet</h3>
                <p className="text-gray-500 mt-2">Kontakt din administrator</p>
            </div>
        );
    }

    if (children.length === 0) {
        return (
            <div className="glass-card rounded-2xl p-12 text-center animate-fade-in-up">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-5 text-gray-400 shadow-inner">
                    <UserIcon />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Ingen børn tilknyttet</h2>
                <p className="text-gray-500 max-w-md mx-auto">
                    Du er ikke tilknyttet nogen børn endnu. Kontakt din leder for at blive tilknyttet.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="glass-card rounded-2xl p-6 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Mine børn</h2>
                        <p className="text-gray-500 mt-1">Oversigt over tilknyttede børn og bevillinger</p>
                    </div>
                    <Link
                        to="/barnepige/registrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 btn-kalundborg rounded-xl font-medium"
                    >
                        <PlusIcon />
                        Registrer timer
                    </Link>
                </div>
            </div>

            {/* Children cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {children.map((child, index) => (
                    <div
                        key={child.id}
                        className="glass-card rounded-2xl overflow-hidden hover-lift animate-fade-in-up"
                        style={{ animationDelay: `${0.1 + index * 0.1}s` }}
                    >
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-[#B54A32] to-[#9a3f2b] rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-[#B54A32]/30">
                                        {child.first_name?.charAt(0)}{child.last_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">
                                            {child.first_name} {child.last_name}
                                        </h3>
                                        <span className="inline-flex items-center px-2.5 py-1 mt-1 rounded-full text-xs font-medium bg-white/50 text-gray-600 border border-white/30 backdrop-blur-sm">
                                            {child.has_frame_grant ? 'Rammebevilling' : translateGrantType(child.grant_type)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Bevillingsstatus */}
                            {child.grantSummary && (
                                <div className="p-4 bg-white/40 rounded-xl border border-white/30 backdrop-blur-sm">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                                        <ClockIcon />
                                        Forbrugt bevilling
                                    </div>
                                    {child.grantSummary.grantType === 'specific_weekdays' ? (
                                        <div className="space-y-2">
                                            {Object.entries(child.grantSummary.weekdays || {}).map(([day, data]) => (
                                                <div key={day} className="flex items-center justify-between p-2 bg-white/30 rounded-lg">
                                                    <span className="text-sm font-medium text-gray-600">{translateWeekday(day)}</span>
                                                    <GrantStatusBadge
                                                        used={data.usedHours}
                                                        total={data.grantHours}
                                                        showBar={false}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <GrantStatusBadge
                                            used={child.grantSummary.usedHours}
                                            total={child.grantSummary.grantHours}
                                        />
                                    )}

                                    {child.grantSummary.periodStart && (
                                        <div className="mt-4 pt-3 border-t border-white/30 text-xs text-gray-500 flex items-center gap-1">
                                            <span className="font-medium">Periode:</span>
                                            {child.grantSummary.periodStart} — {child.grantSummary.periodEnd}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-white/20 bg-white/30">
                            <Link
                                to={`/barnepige/registrer?child=${child.id}`}
                                className="inline-flex items-center gap-2 text-[#B54A32] hover:text-[#9a3f2b] text-sm font-semibold group transition-colors"
                            >
                                Registrer timer for {child.first_name}
                                <ArrowIcon />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick stats */}
            <div className="glass-card rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Hurtig oversigt</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-white/40 rounded-xl border border-white/30 text-center">
                        <div className="text-3xl font-bold text-gray-900">{children.length}</div>
                        <div className="text-sm text-gray-500 mt-1">Tilknyttede børn</div>
                    </div>
                    <div className="p-4 bg-white/40 rounded-xl border border-white/30 text-center">
                        <div className="text-3xl font-bold text-[#B54A32]">
                            {children.filter(c => c.grantSummary && c.grantSummary.usedHours > 0).length}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">Med registreringer</div>
                    </div>
                    <Link
                        to="/barnepige/registrer"
                        className="p-4 bg-gradient-to-br from-[#B54A32]/10 to-[#B54A32]/5 rounded-xl border border-[#B54A32]/20 text-center hover:bg-[#B54A32]/15 transition-all group"
                    >
                        <div className="text-[#B54A32] mx-auto mb-2">
                            <PlusIcon />
                        </div>
                        <div className="text-sm font-medium text-[#B54A32]">Ny registrering</div>
                    </Link>
                    <Link
                        to="/barnepige/timer"
                        className="p-4 bg-white/40 rounded-xl border border-white/30 text-center hover:bg-white/60 transition-all group"
                    >
                        <div className="text-gray-600 mx-auto mb-2">
                            <ClockIcon />
                        </div>
                        <div className="text-sm font-medium text-gray-700">Mine timer</div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
