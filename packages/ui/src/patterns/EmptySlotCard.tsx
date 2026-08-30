import { ReactNode } from 'react';

import { Card } from '../primitives/Card';
import { Text } from '../primitives/Text';

export interface EmptySlotCardProps {
    label?: ReactNode;
}

export function EmptySlotCard({ label = 'Open slot' }: EmptySlotCardProps) {
    return (
        <Card className="flex items-center gap-4 border-dashed bg-transparent">
            <div className="size-12 rounded-md border border-dashed border-border" />
            <Text variant="muted">{label}</Text>
        </Card>
    );
}
