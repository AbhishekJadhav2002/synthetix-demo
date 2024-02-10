export default function Loader({
    className,
}: {
    className?: string;
}): JSX.Element {
    return <div className={`loader ${className ? className : ""}`}></div>;
}
