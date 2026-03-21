import { Badge } from "@/components/ui/badge";
import type { Tag } from "@/types/post.types";

interface TagListProps {
  tags: Tag[];
}

export function TagList({ tags }: TagListProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Badge key={tag.id} variant="outline">
          #{tag.name}
        </Badge>
      ))}
    </div>
  );
}
