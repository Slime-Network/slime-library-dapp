import * as React from 'react';
import {
	CardActionArea, Typography,
	CardMedia, CardContent, Card
} from '@mui/material';

import type { Media } from '../spriggan-shared/types/Media';
import GamePage, { GamePageProps } from './GamePage';

export type MediaCardProps = {
	media: Media;
};

export default function MediaCard( props: MediaCardProps ) {

	const [open, setOpen] = React.useState(false);

	console.log("props: ", props);

	const handleClickOpen = () => {
		setOpen(true);
	};	

	return (
		<div><Card sx={{ maxWidth: 345 }} onClick={ handleClickOpen }>
			<CardActionArea>
				<CardMedia
					component="img"
					height="140"
					image={props.media.capsuleimage}
					alt={props.media.title}
				/>
				<CardContent>
				<Typography gutterBottom variant="h5">
					{props.media.title}
				</Typography>
				<Typography variant="body2" color="text.secondary">
					{props.media.shortdescription}
				</Typography>
				</CardContent>
			</CardActionArea>
		</Card>
		{GamePage({open, setOpen, ...props} as GamePageProps)}
		</div>
	);
};

