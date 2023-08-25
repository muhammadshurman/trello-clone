import {ID, storage} from "@/appwrite"

const uploadImage = async(file: File) => {
    if (!file) return;

    const fileUploaded = await storage.createFile(
        "64e685951713a7d56173",
        ID.unique(),
        file
    );
    return fileUploaded;
};

export default uploadImage;