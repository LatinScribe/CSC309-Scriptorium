interface ButtonProps {
    primary: boolean;
    text: string;
    onClick?: () => void;
}


export default function Button({ primary, text, onClick }: ButtonProps) {
    return (
        <button className={`px-4 py-2 rounded-lg ${primary ? "bg-primary text-white hover:bg-primarylight" : "bg-grey text-black hover:bg-lightgrey"}`} onClick={onClick}>
        {text}
        </button>
    );
}