import Button from "./button"

export default function SearchBar() {
    return (
        <div className="flex items-center justify-center gap-5">
            <input
                type="text"
                placeholder="Search"
                className="w-96 p-2 border border-primary rounded"
            />
            <Button text="Search" primary={true}/>
        </div>
    )
}