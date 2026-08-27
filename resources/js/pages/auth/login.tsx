import { AuthLayout, SteamSignInButton } from '@bucabull/ui';
import { Head } from '@inertiajs/react';

export default function Login() {
    return (
        <AuthLayout title="Log in" description="Sign in with your Steam account to continue" appName="Bucabull">
            <Head title="Log in" />
            <div className="flex justify-center">
                <SteamSignInButton href={route('steam.redirect')} />
            </div>
        </AuthLayout>
    );
}
