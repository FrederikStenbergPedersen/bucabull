import { Head, router, usePage } from '@inertiajs/react';
import { Button, Card, Text } from '@newapp/ui';

import { type SharedData } from '@/types';

export default function Dashboard() {
    const { auth } = usePage<SharedData>().props;

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6">
            <Head title="Dashboard" />
            <Card className="w-full max-w-sm text-center">
                <Text variant="heading">Welcome, {auth.user.name}</Text>
                <Text variant="muted" className="mt-2">
                    No features here yet — this is just the auth flow proving out the component library.
                </Text>
                <Button variant="secondary" className="mt-6" onClick={() => router.post(route('logout'))}>
                    Log out
                </Button>
            </Card>
        </div>
    );
}
