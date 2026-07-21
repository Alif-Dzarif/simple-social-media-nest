import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Comment } from '../../comments/entities/comment.entity';
import { Post } from '../../posts/entities/post.entity';
import { Follow } from '../../follows/entities/follow.entity';
import { Like } from '../../likes/entities/like.entity';

@Entity({ name: 'users', })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  username!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @OneToMany(() => Post, (post) => post.user_id)
  posts!: Post[];

  @OneToMany(() => Comment, (comment) => comment.user_id)
  comments!: Comment[];

  @OneToMany(() => Like, (like) => like.user_id)
  likes!: Like[];

  @OneToMany(() => Follow, (follow) => follow.user_id)
  following!: Follow[];

  @OneToMany(() => Follow, (follow) => follow.follower_id)
  followers!: Follow[];
}
