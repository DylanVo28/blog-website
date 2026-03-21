import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('post_tags')
export class PostTagEntity {
  @PrimaryColumn({ name: 'post_id', type: 'uuid' })
  postId!: string;

  @PrimaryColumn({ name: 'tag_id', type: 'uuid' })
  tagId!: string;
}
