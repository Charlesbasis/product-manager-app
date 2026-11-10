import { cn } from '@/lib/utils';
import { Boxes, type LucideProps } from 'lucide-react';

export default function AppLogoIcon(props: LucideProps) {
    return (
        <Boxes
            strokeWidth={2.25}
            {...props}
            className={cn('size-5', props.className)}
        />
    );
}
