import { Link, useLocation, useNavigate } from 'react-router-dom';

// Kalundborg Kommune Logo Component (fem-tårnet kirke med bølger)
const KalundborgLogo = () => (
    <svg viewBox="0 0 80 60" className="h-10 w-auto" fill="currentColor">
        {/* De fem tårne med kors */}
        <g fill="currentColor">
            {/* Tårn 1 */}
            <rect x="8" y="20" width="8" height="25" />
            <polygon points="12,8 6,20 18,20" />
            <rect x="10" y="2" width="4" height="8" />
            <rect x="8" y="4" width="8" height="2" />

            {/* Tårn 2 */}
            <rect x="20" y="20" width="8" height="25" />
            <polygon points="24,8 18,20 30,20" />
            <rect x="22" y="2" width="4" height="8" />
            <rect x="20" y="4" width="8" height="2" />

            {/* Tårn 3 (center - tallest) */}
            <rect x="32" y="15" width="10" height="30" />
            <polygon points="37,3 29,15 45,15" />
            <rect x="35" y="-3" width="4" height="8" />
            <rect x="33" y="-1" width="8" height="2" />

            {/* Tårn 4 */}
            <rect x="46" y="20" width="8" height="25" />
            <polygon points="50,8 44,20 56,20" />
            <rect x="48" y="2" width="4" height="8" />
            <rect x="46" y="4" width="8" height="2" />

            {/* Tårn 5 */}
            <rect x="58" y="20" width="8" height="25" />
            <polygon points="62,8 56,20 68,20" />
            <rect x="60" y="2" width="4" height="8" />
            <rect x="58" y="4" width="8" height="2" />
        </g>

        {/* Bølger under kirken */}
        <path d="M5,50 Q15,45 25,50 T45,50 T65,50 T75,50" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M5,56 Q15,51 25,56 T45,56 T65,56 T75,56" fill="none" stroke="currentColor" strokeWidth="3" />
    </svg>
);

// Mobile/Desktop icons
const MobileIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
);

const DesktopIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

// SVG Icons
const Icons = {
    dashboard: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
    ),
    check: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    users: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    child: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    ),
    clock: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    list: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
    )
};

export default function Layout({ children, userRole, onRoleChange, isMobileView, onMobileViewChange }) {
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path) => location.pathname === path;

    const adminNavItems = [
        { path: '/admin', label: 'Oversigt', icon: Icons.dashboard },
        { path: '/admin/godkendelse', label: 'Godkendelse', icon: Icons.check },
        { path: '/admin/boern', label: 'Børn', icon: Icons.child },
        { path: '/admin/barnepiger', label: 'Barnepiger', icon: Icons.users },
    ];

    const godkenderNavItems = [
        { path: '/godkender/godkendelse', label: 'Godkendelse', icon: Icons.check },
        { path: '/godkender/boern', label: 'Børn', icon: Icons.child },
        { path: '/godkender/barnepiger', label: 'Barnepiger', icon: Icons.users },
    ];

    const caregiverNavItems = [
        { path: '/barnepige', label: 'Mine børn', icon: Icons.child },
        { path: '/barnepige/registrer', label: 'Registrer timer', icon: Icons.clock },
        { path: '/barnepige/mine-timer', label: 'Mine registreringer', icon: Icons.list },
    ];

    const getNavItems = () => {
        switch (userRole) {
            case 'admin': return adminNavItems;
            case 'godkender': return godkenderNavItems;
            case 'caregiver': return caregiverNavItems;
            default: return adminNavItems;
        }
    };

    const navItems = getNavItems();

    const getRoleLabel = () => {
        switch (userRole) {
            case 'admin': return 'Administrator';
            case 'godkender': return 'Godkender';
            case 'caregiver': return 'Barnepige';
            default: return 'Ukendt';
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header - Kalundborg rød */}
            <header className="bg-[#B54A32] sticky top-0 z-50 shadow-lg">
                <div className="w-full px-6 lg:px-12 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            {/* Logo */}
                            <Link to="/" className="flex items-center gap-4 group">
                                <div className="text-white drop-shadow-lg transition-transform group-hover:scale-105">
                                    <KalundborgLogo />
                                </div>
                                <div className="border-l border-white/20 pl-4">
                                    <h1 className="text-lg font-bold text-white tracking-wide drop-shadow-md">
                                        KALUNDBORG
                                    </h1>
                                    <p className="text-white/70 text-xs tracking-widest uppercase">Kommune</p>
                                </div>
                            </Link>

                            {/* Divider */}
                            <div className="hidden md:block h-10 w-px bg-white/10"></div>

                            {/* App title */}
                            <div className="hidden md:block">
                                <h2 className="text-white font-medium drop-shadow-sm">Timeregistrering</h2>
                                <p className="text-white/60 text-xs">Barnepige-ordningen</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Mobile/Desktop toggle */}
                            <button
                                onClick={() => onMobileViewChange(!isMobileView)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                                    isMobileView
                                        ? 'bg-white text-[#B54A32] border-white shadow-lg'
                                        : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                                }`}
                                title={isMobileView ? 'Skift til desktop visning' : 'Skift til mobil visning'}
                            >
                                {isMobileView ? <MobileIcon /> : <DesktopIcon />}
                                <span className="hidden sm:inline">{isMobileView ? 'Mobil' : 'Desktop'}</span>
                            </button>

                            {/* Role badge - glass style */}
                            <span className="hidden sm:inline-flex px-4 py-2 bg-white/10 backdrop-blur-sm text-white text-xs font-medium rounded-full border border-white/20 shadow-lg">
                                {getRoleLabel()}
                            </span>

                            {/* Role switcher (for demo) - glass style */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-white/60 hidden sm:inline">Vis som:</span>
                                <select
                                    value={userRole}
                                    onChange={(e) => {
                                        const role = e.target.value;
                                        onRoleChange(role);
                                        if (role === 'admin') {
                                            navigate('/admin');
                                        } else if (role === 'godkender') {
                                            navigate('/godkender/godkendelse');
                                        } else if (role === 'caregiver') {
                                            navigate('/barnepige/registrer');
                                        }
                                    }}
                                    className="text-sm bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-xl px-4 py-2 focus:ring-2 focus:ring-white/30 focus:outline-none cursor-pointer hover:bg-white/20 transition-all shadow-lg"
                                >
                                    <option value="admin" className="text-gray-900">Administrator</option>
                                    <option value="godkender" className="text-gray-900">Godkender</option>
                                    <option value="caregiver" className="text-gray-900">Barnepige</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation - Hvid baggrund */}
            <nav className="bg-white sticky top-[72px] z-40 border-b border-gray-200 shadow-sm">
                <div className="w-full px-6 lg:px-12">
                    <div className="flex gap-2 overflow-x-auto py-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
                                    isActive(item.path)
                                        ? 'bg-gradient-to-r from-[#B54A32] to-[#9a3f2b] text-white shadow-lg shadow-[#B54A32]/25'
                                        : 'text-gray-600 hover:bg-white/50 hover:text-[#B54A32] hover:shadow-md'
                                }`}
                            >
                                <span className={isActive(item.path) ? 'text-white' : 'text-gray-400'}>
                                    {item.icon}
                                </span>
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Main content */}
            <main className="flex-1 w-full px-6 lg:px-12 py-8">
                <div className="animate-fade-in">
                    {children}
                </div>
            </main>

            {/* Footer - Hvid baggrund */}
            <footer className="bg-white mt-auto border-t border-gray-200">
                <div className="w-full px-6 lg:px-12 py-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 text-[#B54A32]">
                            <div className="p-2 bg-[#B54A32]/10 rounded-xl">
                                <KalundborgLogo />
                            </div>
                            <div>
                                <span className="text-sm font-semibold block">Kalundborg Kommune</span>
                                <span className="text-xs text-gray-500">Timeregistrering for Barnepige-ordningen</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="h-1 w-1 rounded-full bg-gray-300 hidden sm:block"></div>
                            <p className="text-xs text-gray-400">
                                Kalundborg Kommune
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
