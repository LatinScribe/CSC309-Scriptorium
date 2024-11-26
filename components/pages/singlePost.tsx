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
import ReportDialog from "../pages/reportDialog";

const BlogPostPage = () => {
    const router = useRouter();
    const { session } = useContext(SessionContext);
    // const [postId, setPostId] = useState<string | null>(null);    // get blog id
    const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    // const [loading, setLoading] = useState(true);

    const [repliesText, setRepliesText] = useState<{ [key: number]: string }>({});  // maintain reply text for each comment separately
    const [activeReplies, setActiveReplies] = useState<Record<number, boolean>>({});

    const [blogVote, setBlogVote] = useState<"upvoted" | "downvoted" | null>(null);
    const [commentVotes, setCommentVotes] = useState<Record<number, "upvoted" | "downvoted" | null>>({});

    const [isPostDialogOpen, setIsPostDialogOpen] = useState(false); // Controls Post Report Dialog
    // mapping to store the state for each comment; key is commentID
    const [activeDialogs, setActiveDialogs] = useState<{ [commentId: number]: boolean }>({}); 

    const [selectedReportId, setSelectedReportId] = useState<number | null>(null); // Store which post/comment is selected for reporting
    const [selectedReportType, setSelectedReportType] = useState("blog"); // Type of report: "post" or "comment"
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    

    
    const { id } = router.query;
    // const postId = id ? Number(id) : null;
    const postId = router.query.id ? Number(router.query.id) : null;


    useEffect(() => {
      // Wait for the router to be ready to make sure the query is populated
        if (!postId) {
            console.log("No valid postId available");  
            return;
        }
      const fetchData = async () => {
        try {

            const responseBlog = await fetchBlogPost(postId, session);
            setBlogPost(responseBlog);

            const commentsResponse = await fetchComments(postId, session);
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
          // setComments((prev) => [...prev, response]);
          setComments((prev) => [...prev, { ...response, author: session.user }]);
          setNewComment("");
          toast.success("Comment posted!");
      } catch (error) {
          console.error("Failed to post comment:", error);
          toast.error("Failed to post your comment.");
      }
    };

    const handleReplySubmit = async (parentCommentId: number, reply: string) => {
      if (!reply) return; // Don't allow empty replies
      if (!reply.trim()) {
          toast.error("Comment cannot be empty.");
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
                ? {
                    ...comment,
                    replies: [
                      ...(comment.replies || []),
                      { ...replyResponse, author: session.user }
                    ]
                  }
                : comment
            )
          );

          setActiveReplies((prev) => ({
            ...prev,
            [parentCommentId]: true,  
          }));
          
      
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
              }
            }

        } catch (error) {
            toast.error(`Failed to ${type} content.`);
        }
    };

    const handleReport = async (contentId: number, explanation: string, reportType: string) => {
        if (!session || !session.accessToken) {
            toast.error("Please sign in");
            return;
        }
        if (!explanation) {
          toast.error("Please provide an explanation.");
          return;
        }
          
        try {
          let response = null;
          if (reportType==="blog") {
            response = await reportBlog(contentId, explanation, session);
            
          } else if (reportType === "comment"){
            response = await reportComment(contentId, explanation, session);
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
  
    const openReportDialog = (type: string, id: number) => {
      setSelectedReportType(type); // Set report type to either "post" or "comment"
      setSelectedReportId(id); 
      if (type === "blog") {
        setIsPostDialogOpen(true); // Open the Post Report Dialog
      } else if (type === "comment") {
        setActiveDialogs((prev) => ({ ...prev, [id]: true }));
      }
    };

    const handleReplyChange = (commentId: number, text: string) => {
      setRepliesText((prev) => ({
        ...prev,
        [commentId]: text,
      }));
    };

    

    


    const renderComments = (commentsList: any[]) =>
      commentsList.map((comment) => (
        <div key={comment.id} className="p-4 rounded-md my-2 bg-background-50">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {/* Author and Time Ago */}
              <p className="text-sm text-gray-500 font-semibold">{comment.author?.username}</p>
              <span className="text-sm text-gray-400">•</span>
              <p className="text-sm text-gray-400">{new Date(comment.createdAt).toLocaleString()}</p> 
            </div>
            
            {/* Comment Content */}
            <p className="text-base text-gray-800 mt-1">{comment.content}</p>
            
            <div className="flex gap-2 mt-2">
              <Button 
                onClick={() => handleVote("upvote", comment.id, false)} 
                variant="outline" 
                size="sm" 
                className={commentVotes[comment.id] === "upvoted" ? "text-green-500" : ""}
              >
                <ThickArrowUpIcon /> {comment.upvoteCount}
              </Button>
              <Button 
                onClick={() => handleVote("downvote", comment.id, false)} 
                variant="outline" 
                size="sm"
              >
                <ThickArrowDownIcon /> {comment.downvoteCount}
              </Button>
              <Button 
                onClick={() => openReportDialog("comment", comment.id)} 
                variant="outline" 
                size="sm" 
                className="px-2 py-1 flex items-center space-x-1 ml-4"
              >
                <ExclamationTriangleIcon /> report
              </Button>
              {activeDialogs[comment.id] && (
                <ReportDialog
                  reportType={"comment"}
                  reportId={comment.id}
                  handleReport={handleReport}
                />
              )}
            </div>
          </div>
    
          {/* Reply input */}
          <div className="flex items-center gap-2 mt-4">
            <Input
              value={repliesText[comment.id] || ""}
              onChange={(e) => handleReplyChange(comment.id, e.target.value)}
              placeholder="Write a reply..."
              className="flex-grow"
            />
            <Button
              onClick={() => {
                handleReplySubmit(comment.id, repliesText[comment.id]);
                setRepliesText((prev) => ({ ...prev, [comment.id]: "" })); // Clear reply text after submitting
              }}
              className="ml-2"
            >
              Reply
            </Button>
          </div>
    
          {/* Show/hide replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => toggleReplies(comment.id)}
                className="text-sm text-gray-500 hover:underline"
              >
                {activeReplies[comment.id] ? "Hide Replies" : "Show Replies"}
              </button>
              {activeReplies[comment.id] && comment?.replies?.length > 0 && (
                <div className="mt-4 pl-4 border-l">
                  {renderComments(comment.replies)}
                </div>
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
                      <Button 
                        onClick={() => setIsPostDialogOpen(true)} 
                        variant="outline" size="sm" className="px-2 py-1 flex items-center space-x-1 ml-4">
                        <ExclamationTriangleIcon/> report </Button>
                      {isPostDialogOpen && (
                        <ReportDialog
                          reportType={"blog"} // "blog" or "comment"
                          reportId={blogPost.id} 
                          handleReport={handleReport} // function to handel submitting report
                          
                        />
                      )}
                                
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
    comment.replies = []; 
    commentMap.set(comment.id, comment);
  });

  const roots: Comment[] = [];

  comments.forEach((comment) => {
    if (comment.parentCommentId) {
      // attach as a reply to its parent
      const parent = commentMap.get(comment.parentCommentId);
      if (parent) {
        parent.replies.push(comment);
      }
    } else { // top level comment
      roots.push(comment);
    }
  });

  return roots; // only returns top level comments
};

export default BlogPostPage;







