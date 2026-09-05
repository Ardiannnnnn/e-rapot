import Link from "next/link";

interface ButtonProps {
    title: string;
    href?: string;
    classname?: string;
    onClick?: () => void;
}

export default function ButtonHijau({ title, href, classname = "", onClick }: ButtonProps) {
    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={`bg-[#1b4332] hover:bg-[#143225] text-white ${classname}`}
            >
                {title}
            </button>
        );
    }

    return (
        <Link
            href={href || '#'}
            className={`bg-[#1b4332] hover:bg-[#143225] text-white ${classname}`}>
            {title}
        </Link>
    );
}

export function ButtonTrans({ title, href, classname = "", onClick }: ButtonProps) {
    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={`bg-white border hover:bg-stone-50 ${classname}`}
            >
                {title}
            </button>
        );
    }

    return (
        <Link
            href={href || '#'}
            className={`bg-white border hover:bg-stone-50 ${classname}`}>
            {title}
        </Link>
    );
}

export function ButtonAmber({ title, href, classname = "", onClick }: ButtonProps) {
    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={`bg-amber-500 hover:bg-amber-600 text-white ${classname}`}
            >
                {title}
            </button>
        );
    }

    return (
        <Link
            href={href || '#'}
            className={`bg-amber-500 hover:bg-amber-600 text-white ${classname}`}>
            {title}
        </Link>
    );
}