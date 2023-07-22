import {
	CardActionArea, Typography,
	CardMedia, CardContent, Card
} from '@mui/material';
import * as React from 'react';

import type { Media } from '../spriggan-shared/types/spriggan/Media';
import { MediaPage, MediaPageProps } from './MediaPage';

export type MediaCardProps = {
	media: Media;
};

export const MediaCard = (props: MediaCardProps) => {

	const [open, setOpen] = React.useState(false);

	console.log("props: ", props);

	const handleClickOpen = () => {
		setOpen(true);
	};

	return (
		<div><Card sx={{ maxWidth: 345 }} onClick={handleClickOpen}>
			<CardActionArea>
				<CardMedia
					component="img"
					height="140"
					image={props.media.capsuleImage}
					alt={props.media.title}
				/>
				<CardContent>
					<Typography gutterBottom variant="h5">
						{props.media.title}
					</Typography>
					<Typography variant="body2" color="text.secondary">
						{props.media.shortDescription}
					</Typography>
				</CardContent>
			</CardActionArea>
		</Card>
			{MediaPage({ open, setOpen, ...props } as MediaPageProps)}
		</div>
	);
};

