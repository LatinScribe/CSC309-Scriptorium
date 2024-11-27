export interface User {
    id: number;
    username: string; // unique, at least 2 char, alpha-numeric
    password: string; // at least 8 chars, 1 lower, 1 upper, 1 number, 1 special
    salt: string; // salting the password!
    firstName: string | null; // optional, at least 2 char
    lastName: string | null; // optional, at least 2 char
    email: string; // unique, should only be changed by admin
    avatar: string | null; // optional, URL or encoded image
    phoneNumber: string | null; // optional, valid phone number
    role: string; // default: "USER"
    deleted: boolean; // default: false, soft delete
    createdAt: Date;
    updatedAt: Date;
  
    blogPosts?: BlogPost[];
    comments?: Comment[];
    codeTemplates?: CodeTemplate[];
    savedTemplates?: SavedCodeTemplate[];
  }
  
  export interface CodeTemplate {
    id: number;
    title: string;
    explanation: string | null;
    tags: string | null;
    forkedSourceId: number | null;
    authorId: number;
    modifiedAt: Date;
    content: string | null;
    language: string;
    deleted: boolean;
  
    author?: User;
    blogPosts?: BlogPost[];
    savedUsers?: SavedCodeTemplate[];
  }
  
  export interface SavedCodeTemplate {
    id: number;
    userId: number;
    codeTemplateId: number;
  
    user?: User;
    codeTemplate?: CodeTemplate;
  }
  
  export interface BlogPost {
    id: number;
    title: string;
    description: string;
    tags: string;
    createdAt: Date;
    flagged: boolean; // default: false
    upvoteCount: number; // default: 0
    downvoteCount: number; // default: 0
    reportsCount: number; // default: 0
    hidden: boolean; // default: false
    authorId: number;
    deleted: boolean; // default: false
  
    upvotes?: BlogPostUpvote[];
    downvotes?: BlogPostDownvote[];
    codeTemplates?: CodeTemplate[];
    comments?: Comment[];
    reports?: Report[];
    author?: User;
  }
  
  export interface BlogPostUpvote {
    id: number;
    blogPostId: number;
    userId: number;
  
    blogPost?: BlogPost;
  }
  
  export interface BlogPostDownvote {
    id: number;
    blogPostId: number;
    userId: number;
  
    blogPost?: BlogPost;
  }
  
  export interface Comment {
    id: number;
    blogPostId: number;
    createdAt: Date;
    authorId: number;
    content: string;
    upvoteCount: number; // default: 0
    downvoteCount: number; // default: 0
    reportsCount: number; // default: 0
    hidden: boolean; // default: false
    parentCommentId: number | null;
    deleted: boolean; // default: false
  
    blogPost?: BlogPost;
    author?: User;
    upvotes?: CommentUpvote[];
    downvotes?: CommentDownvote[];
    parentComment?: Comment;
    replies?: Comment[];
    reports?: Report[];
  }
  
  export interface CommentUpvote {
    id: number;
    commentId: number;
    userId: number;
  
    comment?: Comment;
  }
  
  export interface CommentDownvote {
    id: number;
    commentId: number;
    userId: number;
  
    comment?: Comment;
  }
  
  export interface Report {
    id: number;
    explanation: string;
    blogPostId?: number;
    commentId?: number;
    createdAt: Date;
  
    blogPost?: BlogPost;
    comment?: Comment;
  }
  