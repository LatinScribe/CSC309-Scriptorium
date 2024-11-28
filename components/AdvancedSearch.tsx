import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filters } from "@/utils/types";

export interface AdvancedSearchProps {
    onFiltersChange: (filters: Filters) => void;
    showIdFilter?: boolean;
}

const AdvancedSearchModal = ({ onFiltersChange, showIdFilter }: AdvancedSearchProps) => {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tags, setTags] = useState("");
    const [template, setTemplate] = useState("");

    const handleApplyFilters = () => {
        onFiltersChange({
            title,
            content,
            tags: tags.split(',').map(tag => tag.trim()),
            template,
        });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button>Advanced</Button>
            </DialogTrigger>
            <DialogContent className="bg-background">
                <DialogTitle>Advanced Search</DialogTitle>
                <DialogDescription>
                    Define your search terms for titles, content, tags, and code template title (as mentioned in blogs).
                </DialogDescription>
                <div className="flex flex-col gap-5">
                    <Label htmlFor="title">Title</Label>
                    <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <Label htmlFor="content">Content</Label>
                    <Input
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                        id="tags"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                    />
                    {showIdFilter && (
                        <>
                            <Label htmlFor="ids">Code Template Title</Label>
                            <Input
                                id="ids"
                                value={template}
                                onChange={(e) => setTemplate(e.target.value)}
                            />
                        </>
                    )}
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                    <DialogClose asChild>
                        <Button variant="secondary">Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button onClick={handleApplyFilters}>Apply Filters</Button>
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AdvancedSearchModal;