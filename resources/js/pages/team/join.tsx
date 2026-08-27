import { Head, useForm } from '@inertiajs/react';
import { Button, Card, FieldError, Input, Label, Text } from '@newapp/ui';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

export default function TeamJoin() {
    const createForm = useForm({ name: '' });
    const joinForm = useForm({ invite_code: '' });

    const submitCreate: FormEventHandler = (e) => {
        e.preventDefault();
        createForm.post(route('team.store'));
    };

    const submitJoin: FormEventHandler = (e) => {
        e.preventDefault();
        joinForm.post(route('team.joinByCode'));
    };

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6">
            <Head title="Join a team" />
            <div className="flex w-full max-w-sm flex-col gap-6">
                <div className="text-center">
                    <Text variant="heading">One more step</Text>
                    <Text variant="muted" className="mt-2">
                        Create a team, or join one with an invite code.
                    </Text>
                </div>

                <Card>
                    <Text variant="subheading">Create a team</Text>
                    <form className="mt-4 flex flex-col gap-4" onSubmit={submitCreate}>
                        <div className="grid gap-2">
                            <Label htmlFor="name">Team name</Label>
                            <Input
                                id="name"
                                value={createForm.data.name}
                                onChange={(e) => createForm.setData('name', e.target.value)}
                                placeholder="Bucabull eSports"
                                disabled={createForm.processing}
                            />
                            <FieldError message={createForm.errors.name} />
                        </div>
                        <Button type="submit" disabled={createForm.processing}>
                            {createForm.processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                            Create team
                        </Button>
                    </form>
                </Card>

                <Card>
                    <Text variant="subheading">Join a team</Text>
                    <form className="mt-4 flex flex-col gap-4" onSubmit={submitJoin}>
                        <div className="grid gap-2">
                            <Label htmlFor="invite_code">Invite code</Label>
                            <Input
                                id="invite_code"
                                value={joinForm.data.invite_code}
                                onChange={(e) => joinForm.setData('invite_code', e.target.value)}
                                placeholder="ABCD1234EF"
                                disabled={joinForm.processing}
                            />
                            <FieldError message={joinForm.errors.invite_code} />
                        </div>
                        <Button type="submit" variant="secondary" disabled={joinForm.processing}>
                            {joinForm.processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                            Join team
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}
