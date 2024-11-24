import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { SessionContext } from "@/contexts/session";
import { BlogPost, Comment } from "@/utils/types";
import { fetchBlogPost, fetchComments, fetchCommentbyId, postComment, rateBlog, rateComment, reportBlog, reportComment } from "@/utils/dataInterface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
// import { formatDate } from "@/utils/format";
import { ExclamationTriangleIcon, ThickArrowDownIcon, ThickArrowUpIcon } from "@radix-ui/react-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";

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
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [templateExplanation, setTemplateExplanation] = useState("");

    const [blogVote, setBlogVote] = useState<"upvoted" | "downvoted" | null>(null);
    const [commentVotes, setCommentVotes] = useState<Record<number, "upvoted" | "downvoted" | null>>({});


    

    
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

          // Refetch all comments to update tree
          setComments((prev) =>
            prev.map((comment) =>
              comment.id === parentCommentId
                ? { ...comment, replies: [...comment.replies, replyResponse] }
                : comment
            )
          );
      
          toast.success("Reply posted!");
        }

      } catch (error) {
          console.error("Failed to post reply:", error);
          toast.error("Failed to post your reply.");
      }

    };


      const handleVote = async (type: "upvote" | "downvote", contentId: number, isBlog: boolean) => {
        if (!session || !session.accessToken) {
            toast.error("Please sign in");
            return;
        }
        try {
            // let response = null;
            if (isBlog) {
              let response = await rateBlog(contentId, type, session);
              if (response) {
                setBlogPost((prev) =>
                    prev ? {
                        ...prev,
                        upvoteCount: response.upvoteCount,
                        downvoteCount: response.downvoteCount
                    } : null
                );
                setBlogVote((prevVote) => {
                  return prevVote === "upvoted" && type === "upvote"
                      ? null
                      : prevVote === "downvoted" && type === "downvote"
                      ? null
                      : type === "upvote"
                      ? "upvoted"
                      : "downvoted";
                });
              }
            } else {
              let response = await rateComment(contentId, type, session);
              if (response) {
                setComments((prev) =>
                  prev.map((comment) =>
                      comment.id === contentId
                          ? {
                              ...comment,
                              upvoteCount: response.upvoteCount,
                              downvoteCount: response.downvoteCount,
                          }
                          : comment
                  )
                );
                setCommentVotes((prevVotes) => ({
                  ...prevVotes,
                  [contentId]: prevVotes[contentId] === "upvoted" && type === "upvote"
                      ? null
                      : prevVotes[contentId] === "downvoted" && type === "downvote"
                      ? null
                      : type === "upvote"
                      ? "upvoted"
                      : "downvoted",
                }));
              // toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} successful!`);
              }
            }

        } catch (error) {
            toast.error(`Failed to ${type} content.`);
        }
    };

    const handleReport = async (contentId: number, explanation: string, isBlog: boolean) => {
        if (!session || !session.accessToken) {
            toast.error("Please sign in");
            return;
        }

        try {
          let response = null;
          if (isBlog) {
            response = await reportBlog(contentId, explanation, session);
            
          } else {
            response = await reportComment(contentId, explanation, session);
          }

          if (response) {
              toast.success("Content reported successfully.");
          }
        } catch (error) {
            toast.error("Failed to report content.");
        }
    };

    const toggleReplies = (commentId: number) => {
      setActiveReplies((prev) => ({
          ...prev,
          [commentId]: !prev[commentId],
      }));
    };

    const openDialog = () => {
      setTemplateExplanation("");
      setShowCreateDialog(true);
    }


    if (!blogPost) return <div>Blog post not found.</div>;


    const renderComments = (commentsList: any[]) =>
      commentsList.map((comment) => (
        <div key={comment.id} className="p-4 rounded-md my-2">
          <div className="flex justify-between items-center">
            <p className="font-semibold">{comment.content}</p>
            <div className="flex gap-1">
              <Button onClick={() => handleVote("upvote", comment.id, false)} variant="outline" size="sm" 
                className={commentVotes[comment.id] === "upvoted" ? "text-green-500" : ""}>
                <ThickArrowUpIcon/> {comment.upvoteCount}</Button>
              <Button onClick={() => handleVote("downvote", comment.id, false)} variant="outline" size="sm">
                <ThickArrowDownIcon/> {comment.downvoteCount}</Button>
              <Button onClick={() => handleReport(comment.id, false)} variant="outline" size="sm" className="px-2 py-1 flex items-center space-x-1 ml-4">
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
                      <Button onClick={() => handleVote("upvote", blogPost.id, true)} variant="outline" size="sm"
                        className={blogVote === "upvoted" ? "text-green-500" : ""} >
                        <ThickArrowUpIcon/> {blogPost.upvoteCount}</Button>
                      <Button 
                        onClick={() => handleVote("downvote", blogPost.id, true)} 
                        variant="outline" 
                        size="sm"
                        className={blogVote === "downvoted" ? "text-red-500" : ""} >
                        <ThickArrowDownIcon/> {blogPost.downvoteCount}</Button>
                      <Button onClick={openDialog} variant="outline" size="sm" className="px-2 py-1 flex items-center space-x-1 ml-4">
                        <ExclamationTriangleIcon/> report </Button>
                        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                                    <DialogContent className="bg-background">
                                        <DialogHeader>
                                            <DialogTitle>Report Post</DialogTitle>
                                            <DialogDescription>
                                                Please enter an explanation below
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="flex flex-col gap-3">
                                            <Label htmlFor="fork-explanation" className="block text-sm font-medium text-gray-700">
                                                Explanation
                                            </Label>
                                            <Textarea
                                                id="fork-explanation"
                                                value={templateExplanation}
                                                onChange={(e) => setTemplateExplanation(e.target.value)}
                                                className="p-2 border border-gray-300 rounded"
                                            />
                                            
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                                                Cancel
                                            </Button>
                                            <Button onClick={() =>handleReport(blogPost.id, templateExplanation, true)}>
                                                Submit
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                                
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


const nestComments = (comments: Comment[]) => {
  const commentMap = new Map();

  // Initialize map with comments
  comments.forEach((comment: Comment) => {
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







