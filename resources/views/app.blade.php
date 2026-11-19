<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark'=> ($appearance ?? 'system') == 'dark'])>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- Add CSRF Token for Axios -->
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!--  Get the CSP Nonce from the SecurityHeaders Middleware -->
    @php
    $nonce = request()->attributes->get('csp_nonce');
    @endphp

    {{-- Inline script to detect system dark mode preference and apply it immediately --}}
    <!--  Added nonce attribute -->
    <script nonce="{{ $nonce }}">
        (function() {
            const appearance = '{{ $appearance ?? "system" }}';

            if (appearance === 'system') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                if (prefersDark) {
                    document.documentElement.classList.add('dark');
                }
            }
        })();
    </script>

    {{-- Inline style to set the HTML background color based on our theme in app.css --}}
    <!-- Note: We allow 'unsafe-inline' for styles in the CSP middleware, so this is safe -->
    <style>
        html {
            background-color: oklch(1 0 0);
        }

        html.dark {
            background-color: oklch(0.145 0 0);
        }
    </style>

    <title inertia>{{ config('app.name', 'Nexus Inventory') }}</title>

    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">

    @viteReactRefresh
    @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
    @inertiaHead
</head>

<body class="font-sans antialiased">
    @inertia

    @if (config('app.url') === 'https://app3.cvhowlader.com')
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-HF5YYQRYT6"></script>

    <!-- Added nonce attribute to GTM inline script -->
    <script nonce="{{ $nonce }}">
        window.dataLayer = window.dataLayer || [];

        function gtag() {
            dataLayer.push(arguments);
        }
        gtag('js', new Date());

        gtag('config', 'G-HF5YYQRYT6');
    </script>
    @endif
</body>

</html>
