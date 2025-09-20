import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { setUserRole } from '../../firebase/functions';
import { useToast } from '../../hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function UserRoleManager() {
    const [targetUid, setTargetUid] = useState('');
    const [newRole, setNewRole] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSetRole = async () => {
        if (!targetUid || !newRole) {
            toast({ variant: "destructive", title: "Missing Information", description: "Please provide both a User ID and a role." });
            return;
        }
        setIsLoading(true);
        try {
            const result = await setUserRole({ targetUid, newRole });
            toast({ title: "Success", description: result.data.message });
            setTargetUid('');
            setNewRole('');
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Set User Role</CardTitle>
                <CardDescription>
                    Enter a user's UID and assign them a new role. You can find the UID in the Firebase Authentication console.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Input
                    placeholder="User ID (UID)"
                    value={targetUid}
                    onChange={(e) => setTargetUid(e.target.value)}
                />
                <Select onValueChange={setNewRole} value={newRole}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="analyst">Analyst</SelectItem>
                        <SelectItem value="benchmarking_admin">Benchmarking Admin</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={handleSetRole} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Assign Role
                </Button>
            </CardContent>
        </Card>
    );
}

