import { Head } from '@inertiajs/react';
import { AuthLayout, Button } from '@bucabull/ui';

export default function Login() {
    return (
        <AuthLayout title="Log in" description="Sign in with your Steam account to continue" appName="Bucabull">
            <Head title="Log in" />
            <a href={route('steam.redirect')} className="block">
                <Button type="button" className="w-full">
                    Log in with Steam
                </Button>
            </a>
        </AuthLayout>
    );
}
