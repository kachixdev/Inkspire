import multer from "multer";

const extensions = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
};

const uploadAvatar = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 10 },
    fileFilter: (_req, file, callback) => {
        if (!extensions[file.mimetype]) {
            return callback(new Error("Avatar must be a JPEG, PNG, or WebP image."));
        }
        callback(null, true);
    }
});

export function handleAvatarUpload(req, res, next) {
    uploadAvatar.single("avatar")(req, res, (error) => {
        if (!error) return next()

        if (error.code?.startsWith("LIMIT") || error.message.startsWith("Avatar must")) {
            return res.status(400).json({ message: error.message })
        }

        next(error)
    })
}
