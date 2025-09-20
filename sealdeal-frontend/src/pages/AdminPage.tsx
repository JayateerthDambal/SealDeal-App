import { useState } from 'react';
import UserRoleManager from '../components/admin/UserRoleManager';
import BenchmarkDataManager from '../components/admin/BenchmarkDataManager';
import { useAuth } from '../hooks/useAuth';
import { Shield, Database } from 'lucide-react';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'users' | 'benchmarks'>('users');
    const { role } = useAuth(); // Get user role

    // Only full admins can manage user roles
    const canManageUsers = role === 'admin';

    // If a benchmarking_admin logs in, default their view to the benchmarks tab
    useState(() => {
        if (role === 'benchmarking_admin' && !canManageUsers) {
            setActiveTab('benchmarks');
        }
    });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-primary">Admin Panel</h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Manage user roles and system-wide benchmark data.
                </p>
            </div>

            <div className="border-b border-primary/10">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {canManageUsers && (
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-primary hover:border-primary/30'
                            }`}
                        >
                            <Shield className="mr-2 h-5 w-5"/> User Role Management
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('benchmarks')}
                        className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'benchmarks' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-primary hover:border-primary/30'
                        }`}
                    >
                        <Database className="mr-2 h-5 w-5"/> Benchmark Data
                    </button>
                </nav>
            </div>

            <div>
                {activeTab === 'users' && canManageUsers && <UserRoleManager />}
                {activeTab === 'benchmarks' && <BenchmarkDataManager />}
            </div>
        </div>
    );
}

