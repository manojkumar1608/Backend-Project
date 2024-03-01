import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    //TODO: get all videos based on query, sort, pagination
    
    const { page = 1, limit = 10, query =`/^video/` , sortBy= "createddAt", sortType= 1, userId= req.user._id} = req.query
    
    // find user in db
    const user = await User.findById(
        {
            _id: userId
        }
    )

    if(!user){
        throw new ApiError(404, "user not found")
    }

    const getAllVideosAggregate = await Video.aggregate([
        {
            $match: { 
                owner: new mongoose.Types.ObjectId(userId),
                $or: [
                    { title: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ]
            }
        },
        {
            $sort:{
                [sortBy]: sortType
            }
        },
        {
            $skip: (page -1) * limit
        },
        {
            $limit: parseInt(limit)
        }

    ])

    Video.aggregatePaginate(getAllVideosAggregate, {page, limit})
    .then((result)=>{
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                result,
                "fetched all videos successfully !!"
            )
        )
    })
    .catch((error)=>{
        console.log("getting error while fetching all videos:",error)
        throw error
    })
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    const userid = req.user._id
    // TODO: get video, upload to cloudinary, create video
    const videoLocalPath = req.files?.videoFile[0]?.path
    if(!videoLocalPath){
        throw new ApiError(400,"VideoFile is required")
    }

    const VideoFile = await uploadOnCloudinary(videoLocalPath)
    if(!VideoFile){
        throw new ApiError(400,"VideoFile is required")
    }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    if(!thumbnailLocalPath){
        throw new ApiError(400,"Thumbnail is required")
    }

    const Thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if(!Thumbnail){
        throw new ApiError(400,"Thumbnail is required")
    }

    const videoPublish = await Video.create({
        title,
        description,
        duration: VideoFile.duration,
        owner: userid,
        isPublished,
        videoFile:
         {
            public_id: VideoFile?.public_id,
            url: VideoFile.url
         },
         thumbnail:{
            public_id: Thumbnail?.public_id,
            url: Thumbnail.url
         }

    })

    if(!videoPublish){
        throw new ApiError(500, "Something went wrong while creating video")
    }
    return res.status(200)
    .json(
        new ApiResponse(200, {videoPublish}, "Video has been created successfully")
        )
        
    
})

const getVideoById = asyncHandler(async (req, res) => {
    // const { videoId } = req.params
    //TODO: get video by id
    
    try {
        const { videoId } = req.params
        const video = await Video.findById(videoId)
        if(!video){
            throw new ApiError(400, "video not found")
        }
        return res(200).json( new ApiResponse(200,{ video})," Video found successfully" )
    } catch (error) {
        throw new ApiError(404, error.message)
        
    }
})


const updateVideo = asyncHandler(async (req, res) => {
    // const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    
    
        const { videoId } = req.params
        const video = await Video.findById(videoId)
        const {title , description} = req.body
        if
        (!(thumbnail || !(!title || title?.trim() === "") || !(!description || description?.trim() === ""))
        ){
            throw new ApiError(400 ,"Fields must be Required")
        }
        
        const previousVideo = await Video.findById(videoId)

        if(!previousVideo){
            throw new ApiError(404 ,"Video not Found")
        }


        let updateFields ={
            $set:{
                title,
                description,
            }

        }

        // if thumbnail provided delete previous file upload new one

        let thumbnailUploadOnCloudinary;

        if(thumbnail){
        const deletedFile = await deleteOnCloudinary(previousVideo.thumbnail?.public_id)
        }
        
        
        const thumbnailLocalPath = req.file.path
        if(!thumbnailLocalPath){
            throw new ApiError(404 , "Thumbnail required")
        }

        thumbnailUploadOnCloudinary = await uploadOnCloudinary(thumbnailLocalPath)

        if(!thumbnailUploadOnCloudinary){
            throw new ApiError(500 , "unable to upload on cloud")
        }

         updateFields.$set = {
            thumnail: {
                public_id: thumbnailUploadOnCloudinary.public_id,
                url: thumbnailUploadOnCloudinary.url
            }
         }

         const updatevideoDetails =await Video.findByIdAndUpdate({
            videoId,
            updateFields
         })
         if(!updatevideoDetails){
            throw new ApiError(500 , "Something went wrong while updating Video Detail")

         }
         return res.status(200)
         .json(new ApiResponse(200 ,{updatevideoDetails}, "Video details updated successfully" ))
    }
)

const deleteVideo = asyncHandler(async (req, res) => {
    //TODO: delete video
    const { videoId } = req.params
    const video =  Video.findById(videoId)
    if(!isValidObjectId(video)){
        throw new ApiError(404, "Video not found")
    }

    //find in DB

    const videoinDB = await Video.findById(videoId)
    
    if(!videoinDB){
        throw new ApiError(404, "video not found ")
    }

    
    if(videoinDB.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "Unauthorized Request")
    }
    //delete video and thumbnail  in cloudinary

    if(videoinDB.thumbnail){
         await deleteOnCloudinary(videoinDB.thumbnail) 
    }

    if(videoinDB.videoFile){
        await deleteOnCloudinary(videoinDB.videoFile,"videoinDB")
    }

    const deletedResponce = await Video.findByIdAndDelete(videoId)
    if(!deletedonDB){
        throw new ApiError(500, "Something went wrong while deleting video")
    }
    return res.status(200)
    .json(new ApiResponse(200, { deletedResponce }, "Video Deleted Successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(404, "video is not in valid format")
    }
    const video = Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to toggle this video!")
    }

    // toggle video status
    video.isPublished = !video.isPublished

    await video.save({validateBeforeSave: false})

    //return responce 
    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            "video toggle successful!!"
        ))

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
