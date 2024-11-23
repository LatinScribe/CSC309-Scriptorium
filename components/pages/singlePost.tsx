import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { SessionContext } from "@/contexts/session";
import { BlogPost, Comment } from "@/utils/types";
import { fetchBlogPost, fetchComments, fetchCommentbyId, postComment, replyToComment } from "@/utils/dataInterface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
// import { formatDate } from "@/utils/format";
import { ExclamationTriangleIcon, ThickArrowDownIcon, ThickArrowUpIcon } from "@radix-ui/react-icons";

const BlogPostPage = () => {
    const router = useRouter();
    const { session } = useContext(SessionContext);
    // const [postId, setPostId] = useState<string | null>(null);    // get blog id
    const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    // const [loading, setLoading] = useState(true);

    const [replyText, setReplyText] = useState("");
    const [activeReplies, setActiveReplies] = useState<Record<number, boolean>>({});

    
    const { id } = router.query;
    // const postId = id ? Number(id) : null;
    const postId = router.query.id ? Number(router.query.id) : null;


    useEffect(() => {
      // Wait for the router to be ready (to make sure the query is populated)
      console.log("router.query.id:", id);  // Debug the query parameter
        if (!postId) {
            console.log("No valid postId available");  // Ensure postId is available
            return;
        }
      const fetchData = async () => {
        try {
            const responseBlog = await fetchBlogPost(postId);
            setBlogPost(responseBlog);

            const commentsResponse = await fetchComments(postId);
            const nestedComments = nestComments(commentsResponse.comments);
            setComments(nestedComments);
            // setComments(commentsResponse.comments);
        } catch (error) {
            console.error("Error fetching data:", error);
        } 
      };

      if (postId) {
          fetchData();
      }
        
    }, [router.isReady, router.query.id]);

    

    const handleCommentSubmit = async () => {
      if (!session || !session.accessToken) {
        toast.error("Please sign in");
        return;
      }
      if (!newComment.trim()) {
          toast.error("Comment cannot be empty.");
          return;
      }
      try {
          const response = await postComment(Number(postId), newComment, null, session);
          if (!response) {
            toast.error("An error occurred. Pleas sign in again");
          }
          setComments((prev) => [...prev, response]);
          setNewComment("");
          toast.success("Comment posted!");
      } catch (error) {
          console.error("Failed to post comment:", error);
          toast.error("Failed to post your comment.");
      }
    };

    const handleReplySubmit = async (parentCommentId: number, reply: string) => {
      if (!reply.trim()) {
          toast.error("Reply cannot be empty.");
          return;
      }
      try {
        if (session) {
          const replyResponse = await postComment(Number(postId), reply, parentCommentId, session);
          
          if (!replyResponse) {
            toast.error("An error occurred. Pleas sign in again");
          }
          // fetch parent comment
          // const parentComment = await fetchCommentbyId(replyResponse.id, false, session);
          // if (!parentComment) {
          //   toast.error("Error posting reply");
          //   return;
          // }
          // const newComment = {
          //   id: replyResponse.id,
          //   content: reply,
          //   upvoteCount: 0,
          //   downvoteCount: 0,
          //   replies: [],
          //   parentCommentId,
          // };

          // // update comment tree
          // setComments((prevComments) => {
          //   const updatedComments = [...prevComments];  // shallow copy of the current comments state to work on without directly modifying the original state
            
          //   const findAndAddReply = (comments, parentId: number) => {
          //     for (const comment of comments) {
          //       if (comment.id === parentId) {
          //         comment.replies.push(newComment);
          //         return true;
          //       }
          //       if (comment.replies.length > 0) {
          //         const found = findAndAddReply(comment.replies, parentId);
          //         if (found) return true;
          //       }
          //     }
          //     return false;
          //   };

          //   findAndAddReply(updatedComments, parentCommentId);
          //   return updatedComments;
          // });

          // Refetch all comments to update tree
          setComments((prev) =>
            prev.map((comment) =>
              comment.id === parentCommentId
                ? { ...comment, replies: [...comment.replies, replyResponse] }
                : comment
            )
          );
      
          toast.success("Reply added!");
        }

      } catch (error) {
          console.error("Failed to post reply:", error);
          toast.error("Failed to post your reply.");
      }

    };


    // if (!postId) {
    //   return <div>Loading...</div>;  
    // }

    // const toggleReplies = async (commentId: number) => {
    //   if (activeReplies[commentId]) {   // replies are currently visible
    //     setActiveReplies((prev) => {
    //       const newReplies = { ...prev };
    //       delete newReplies[commentId];
    //       return newReplies;
    //     });
    //   } else {
    //     try {
    //       const replies = await fetchCommentbyId(commentId, true, session);
    //       setActiveReplies((prev) => ({
    //         ...prev,
    //         [commentId]: replies,
    //       }));
    //     } catch (error) {
    //       console.error("Failed to fetch replies:", error);
    //     }
    //   }
    // };

    const toggleReplies = (commentId: number) => {
      setActiveReplies((prev) => ({
          ...prev,
          [commentId]: !prev[commentId],
      }));
    };


    if (!blogPost) return <div>Blog post not found.</div>;


    const renderComments = (commentsList: any[]) =>
      commentsList.map((comment) => (
        <div key={comment.id} className="p-4 rounded-md my-2">
          <div className="flex justify-between items-center">
            <p className="font-semibold">{comment.content}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" ><ThickArrowUpIcon/> {blogPost.upvoteCount}</Button>
              <Button variant="outline" size="sm"><ThickArrowDownIcon/> {blogPost.downvoteCount}</Button>
              <Button variant="outline" size="sm" className="px-2 py-1 flex items-center space-x-1 ml-4">
                <ExclamationTriangleIcon/> report </Button>
              
            </div>
          </div>
          

          {/* Reply input */}
          <div className="flex items-center gap-2 mt-4">
            <Input  
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="flex-grow"
            />
            <Button 
              onClick={()=> {
                handleReplySubmit(comment.id, replyText);
                setReplyText("");
              }}
              className="ml-2"
            >
              Reply
            </Button>
          </div>
          
          {/* Show/hide replies */}
          {comment.replies.length > 0 && (
            <div className="mt-4">
              <button
                  onClick={() => toggleReplies(comment.id)}
                  className="text-sm hover:underline"
              >
                  {activeReplies[comment.id] ? "Hide Replies" : "Show Replies"}
              </button>
            {activeReplies[comment.id] && comment?.replies?.length > 0 && (
              <div className="mt-4 pl-4 border-l">{renderComments(comment.replies)}</div>
          )}
          </div>
          )}
          
        </div>
      ));

    return (
      <div className="mx-auto max-w-7xl p-4">
            {blogPost && (
                <div className="bg-white shadow-md rounded p-6 mb-6">
                    <h1 className="text-2xl font-bold">{blogPost.title}</h1>
                    <p className="text-gray-600 text-sm">By {blogPost.author.username}</p>
                    <p className="text-gray-600 text-sm">{new Date(blogPost.createdAt).toLocaleString()}</p>
                    <div className="mt-4">{blogPost.description}</div>
                    <div className="mt-4 flex items-center gap-2">
                      <Button variant="outline" size="sm" ><ThickArrowUpIcon/> {blogPost.upvoteCount}</Button>
                      <Button variant="outline" size="sm"><ThickArrowDownIcon/> {blogPost.downvoteCount}</Button>
                      <Button variant="outline" size="sm" className="px-2 py-1 flex items-center space-x-1 ml-4">
                        <ExclamationTriangleIcon/> report </Button>
                    </div>
                </div>
            )}

            <div className="p-4 rounded">
                <h2 className="text-lg font-bold mb-4">Comments</h2>
                <div className="mb-4 flex">
                    <Input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-grow"
                    />
                    <Button onClick={handleCommentSubmit} className="ml-2">
                        Post
                    </Button>
                </div>
                <div>
                {comments.length > 0 ? (
                  renderComments(comments)
                ) : (     
                  <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                )}
                </div>
            </div>
        </div>
    );
}

// const ReplySection = ({ parentId, replies = [], onReplySubmit }) => {
//     const [replyText, setReplyText] = useState("");

//     return (
//         <div className="ml-4 mt-4 border-l-2 pl-4">
//             <h3 className="font-bold">Replies</h3>
//             <div className="space-y-2">
//                 {replies.map((reply) => (
//                     <div key={reply.id} className="p-2 bg-gray-50 rounded">
//                         <p>{reply.content}</p>
//                         <p className="text-gray-500 text-sm">{formatDate(reply.createdAt)}</p>
//                     </div>
//                 ))}
//             </div>
//             <div className="mt-2 flex">
//                 <Input
//                     value={replyText}
//                     onChange={(e) => setReplyText(e.target.value)}
//                     placeholder="Write a reply..."
//                     className="flex-grow"
//                 />
//                 <Button
//                     onClick={() => {
//                         onReplySubmit(parentId, replyText);
//                         setReplyText("");
//                     }}
//                     className="ml-2"
//                 >
//                     Reply
//                 </Button>
//             </div>
//         </div>
//     );
// };

interface CommentProps {
  comment: Comment;
  onReplySubmit: (parentCommentId: number, content: string) => void;
}

const Comment: React.FC<CommentProps> = ({ comment, onReplySubmit }) => {
  const [replyText, setReplyText] = useState("");

  return (
      <div className="p-4 rounded mb-4">
          <p className="font-semibold">{comment.content}</p>
          <p className="text-gray-500 text-sm">{new Date(comment.createdAt).toLocaleString()}</p>
          <div className="mt-2 flex items-center gap-4">
              <button className="text-blue-500">👍 {comment.upvoteCount}</button>
              <button className="text-red-500">👎 {comment.downvoteCount}</button>
              <button className="text-gray-500">🚩 Flag</button>
          </div>
          <div className="mt-2 flex">
              <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-grow border rounded p-2"
              />
              <button
                  onClick={() => {
                      onReplySubmit(comment.id, replyText);
                      setReplyText("");
                  }}
                  className="ml-2 bg-blue-500 text-white px-4 py-2 rounded"
              >
                  Reply
              </button>
          </div>
          {comment.replies.length > 0 && (
              <div className="ml-6 mt-4 border-l-2 pl-4">
                  {comment.replies.map((reply) => (
                      <Comment key={reply.id} comment={reply} onReplySubmit={onReplySubmit} />
                  ))}
              </div>
          )}
      </div>
  );
};

const nestComments = (comments) => {
  const commentMap = new Map();

  // Initialize map with comments
  comments.forEach((comment) => {
    comment.replies = []; // Ensure a replies field exists
    commentMap.set(comment.id, comment);
  });

  const roots = [];

  comments.forEach((comment) => {
    if (comment.parentCommentId) {
      // Attach as a reply to its parent
      const parent = commentMap.get(comment.parentCommentId);
      if (parent) {
        parent.replies.push(comment);
      }
    } else {
      // Top-level comment
      roots.push(comment);
    }
  });

  return roots; // Return only top-level comments
};

export default BlogPostPage;







