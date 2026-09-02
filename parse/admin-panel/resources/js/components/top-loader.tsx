import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { useHydrated } from '@admin-panel/ui/hooks/use-hydrated';

const SHOW_DELAY_MS = 100;
const TICK_MS = 200;
const DONE_MS = 300;

export function TopLoader() {
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        const offStart = router.on('start', () => setBusy(true));
        const offFinish = router.on('finish', () => setBusy(false));

        return () => {
            offStart();
            offFinish();
        };
    }, []);

    const mounted = useHydrated();
    const [visible, setVisible] = useState(false);
    const [progress, setProgress] = useState(0);
    const busyRef = useRef(busy);

    useEffect(() => {
        busyRef.current = busy;
    }, [busy]);

    useEffect(() => {
        const handoff = document.getElementById('initial-loader') !== null;
        document.documentElement.setAttribute('data-app-ready', '');

        if (handoff) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setProgress(40);
            setVisible(true);
        }
    }, []);

    const [lastBusy, setLastBusy] = useState(busy);

    if (busy !== lastBusy) {
        setLastBusy(busy);

        if (!busy && visible) {
            setProgress(100);
        }
    }

    useEffect(() => {
        if (!mounted) {
            return;
        }

        if (busy && !visible) {
            const show = window.setTimeout(() => {
                if (!busyRef.current) {
                    return;
                }

                setProgress(10);
                setVisible(true);
            }, SHOW_DELAY_MS);

            return () => window.clearTimeout(show);
        }

        if (busy && visible) {
            const tick = window.setInterval(() => {
                setProgress((current) => current + (90 - current) * 0.2);
            }, TICK_MS);

            return () => window.clearInterval(tick);
        }

        if (!busy && visible) {
            const hide = window.setTimeout(() => setVisible(false), DONE_MS);

            return () => window.clearTimeout(hide);
        }

        return;
    }, [busy, visible, mounted]);

    useEffect(() => {
        if (!mounted || visible) {
            return;
        }

        const reset = window.setTimeout(() => setProgress(0), 250);

        return () => window.clearTimeout(reset);
    }, [visible, mounted]);

    if (!mounted) {
        return null;
    }

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-x-0 top-0 z-100 h-0.5 overflow-hidden"
        >
            <div
                className="relative h-full w-full bg-primary transition-[transform,opacity] ease-out will-change-transform"
                style={{
                    opacity: visible ? 1 : 0,
                    transform: `translateX(${progress - 100}%)`,
                    transitionDuration: visible ? '300ms' : '200ms',
                }}
            >
                <div className="absolute top-0 right-0 h-full w-24 -translate-y-px rotate-2 shadow-[0_0_8px_var(--primary),0_0_4px_var(--primary)]" />
            </div>
        </div>
    );
}
