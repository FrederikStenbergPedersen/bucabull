import { Card } from '../primitives/Card';
import { Text } from '../primitives/Text';

export function EmptySlotCard() {
    return (
        <Card className="flex items-center gap-4 border-dashed bg-transparent">
            <div className="size-12 rounded-md border border-dashed border-border" />
            <Text variant="muted">Open slot</Text>
        </Card>
    );
}
