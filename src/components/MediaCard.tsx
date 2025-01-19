import { CardActionArea, Typography, CardMedia, CardContent, Card } from '@mui/material';
import * as React from 'react';

import { useSlimeApi } from '../slime-shared/contexts/SlimeApiContext';
import type { Media } from '../slime-shared/types/slime/Media';
import { MediaPage, MediaPageProps } from './MediaPage';

export type MediaCardProps = {
	media: Media;
};

export const MediaCard = (props: MediaCardProps) => {
	const [open, setOpen] = React.useState(false);
	const { media } = props;
	const { slimeConfig } = useSlimeApi();

	const handleClickOpen = () => {
		setOpen(true);
	};

	const [title, setTitle] = React.useState<string | undefined>(undefined);
	const [shortDescription, setShortDescription] = React.useState<string | undefined>(undefined);
	const [capsuleImage, setCapsuleImage] = React.useState<string | undefined>(undefined);

	React.useEffect(() => {
		if (open) {
			let foundTitle = false;
			let foundShortDescription = false;
			let foundCapsuleImage = false;

			slimeConfig?.languages.forEach((language) => {
				if (!foundTitle) {
					media.titles.forEach((titleI) => {
						if (titleI.language === language && !foundTitle) {
							foundTitle = true;
							setTitle(titleI.title);
						}
					});
				}
				if (!foundShortDescription) {
					media.descriptions.forEach((descriptionI) => {
						if (descriptionI.language === language && descriptionI.type === 'long' && !foundShortDescription) {
							foundShortDescription = true;
							setShortDescription(descriptionI.description);
						}
					});
				}
				if (!foundCapsuleImage) {
					media.images.forEach((image) => {
						if (image.type === 'capsule' && image.language === language && !foundCapsuleImage) {
							foundCapsuleImage = true;
							setCapsuleImage(image.url);
						}
					});
				}
			});

			if (!foundTitle) {
				setTitle(media.titles[0].title);
			}
			if (!foundShortDescription) {
				setShortDescription(media.descriptions[0].description);
			}
			if (!foundCapsuleImage) {
				setCapsuleImage(media.images[0].url);
			}
		}
	}, [media, slimeConfig?.languages, open]);

	return (
		<div>
			<Card sx={{ maxWidth: 345 }} onClick={handleClickOpen}>
				<CardActionArea>
					<CardMedia component="img" height="140" image={capsuleImage} alt={title} />
					<CardContent>
						<Typography gutterBottom variant="h5">
							{title}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{shortDescription}
						</Typography>
					</CardContent>
				</CardActionArea>
			</Card>
			{MediaPage({ open, setOpen, ...props } as MediaPageProps)}
		</div>
	);
};
