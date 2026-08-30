import { Card } from '../primitives/Card';
import { SteamSignInButton } from '../primitives/SteamSignInButton';
import { Text } from '../primitives/Text';

export interface JoinCtaProps {
    href: string;
}

export function JoinCta({ href }: JoinCtaProps) {
    return (
        <Card className="flex flex-col items-start gap-4 border-accent-secondary/30 bg-gradient-to-b from-accent-secondary/10 to-transparent sm:flex-row sm:items-center sm:justify-between">
            <div>
                <Text variant="subheading">Every team gets a page like this</Text>
                <Text variant="muted" className="mt-1">
                    Sign in with Steam to set up your own — roster tracking today, with more team tools and stats on
                    the way.
                </Text>
            </div>
            <SteamSignInButton href={href} className="shrink-0" />
        </Card>
    );
}
