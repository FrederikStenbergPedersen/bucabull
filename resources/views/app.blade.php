<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=public-sans:400,500,600|space-grotesk:500,600" rel="stylesheet" />

        {{-- Grenades' video-preview popout embeds YouTube on hover — warm the connection ahead of time so the popout isn't waiting on DNS/TLS when it actually appears. --}}
        <link rel="preconnect" href="https://www.youtube.com">
        <link rel="preconnect" href="https://i.ytimg.com">

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
