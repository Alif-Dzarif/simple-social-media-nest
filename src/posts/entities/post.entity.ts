import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Like } from "../../likes/entities/like.entity";
import { User } from "../../users/entities/user.entity";
import { Comment } from "../../comments/entities/comment.entity";

@Entity({ name: 'posts', })
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'text', nullable: true })
  caption!: string;

  @Column({ type: 'text', nullable: true })
  image_url!: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @OneToMany(() => Comment, (comment) => comment.post_id)
  comments!: Comment[];

  @OneToMany(() => Like, (like) => like.post_id)
  likes!: Like[];
}
