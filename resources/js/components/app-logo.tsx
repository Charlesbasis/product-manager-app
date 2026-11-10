import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-indigo-600 text-white shadow-sm ring-1 ring-white/10">
                <AppLogoIcon className="size-5" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold tracking-tight">Nexus Inventory</span>
                <span className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">Inventory Control</span>
            </div>
        </>
    );
}
