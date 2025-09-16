import { Avatar, Button } from '@mui/material';
import { useRef, useState } from 'react';

type OutlineInputProps = {
    fieldName: string;
}

export default function PicUploader({ fieldName }: OutlineInputProps) {
    const [profilePic, setProfilePic] = useState<string | undefined>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        
        if (file) {
            const reader = new FileReader();
            
            reader.onload = (ev) => {
                setProfilePic(ev.target?.result as string);
            };
            
            reader.readAsDataURL(file);
        }
    };

    return (
        <>
            <Avatar src={profilePic} sx={{ width: 120, height: 120, mb: 3 }} />
            <Button
                variant="contained"
                size="small"
                onClick={() => fileInputRef.current?.click()}
                sx={{ mb: 1 }}
            >
                Upload
            </Button>
            <input
                type="file"
                name={fieldName}
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleProfilePicChange}
            />
        </>
    )
}