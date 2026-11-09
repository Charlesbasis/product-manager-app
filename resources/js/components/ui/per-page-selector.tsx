import { PerPageSelectorProps } from "@/types";
import { router } from "@inertiajs/react";
import React, { useCallback, useEffect } from "react";
import { Label } from "./label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

export const PerPageSelector = ({
    currentPerPage,
    perPageOptions,
    filters,
    route,
    className,
}: PerPageSelectorProps) => {
    const [selectedPerPage, setSelectedPerPage] = React.useState<string>(String(currentPerPage));

    const handlePerPageChange = useCallback((value: string) => {
        setSelectedPerPage(value);

        const params: Record<string, string | number> = {
            ...filters,
            per_page: Number(value),
            page: 1,
        };

        const queryParams = Object.fromEntries(
            Object.entries(params).filter(
                ([, param]) => param !== '' && param !== undefined && param !== null
            )
        );

        router.get(route, queryParams, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    }, [filters, route]);

    useEffect(() => {
        setSelectedPerPage(String(currentPerPage));
    }, [currentPerPage]);

    // console.log('from page select perPageOptions:', perPageOptions)
    // console.log('from page select selectedPerPage:', selectedPerPage)
    return (
        <div className={`flex items-center gap-2 ${className ?? ''}`}>
            <Label htmlFor="perPage">
                Items per page
            </Label>
            <Select
                value={selectedPerPage}
                onValueChange={handlePerPageChange}
            >
                <SelectTrigger className="h-9 w-[70px]">
                    <SelectValue placeholder={selectedPerPage} />
                </SelectTrigger>
                <SelectContent>
                    {perPageOptions.map((perPage) => (
                        <SelectItem key={perPage} value={String(perPage)}>
                            {perPage}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
