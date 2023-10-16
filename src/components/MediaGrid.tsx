import { Grid, Typography } from "@mui/material";
import Paper from "@mui/material/Paper";

import { Media } from "../spriggan-shared/types/spriggan/Media";
import { MediaCard } from "./MediaCard";

export const MediaGrid = (
	title: string,
	searchResults: Media[],
) => (
	<Paper elevation={1} sx={{ m: 2 }}>
		<Typography sx={{ p: 2 }} variant="h4">{title}</Typography>
		{searchResults && searchResults.length > 0 ? (
			<Grid container p={4} spacing={4} id="medialist">
				{searchResults.map((result: Media) => {
					if (result) {
						return <Grid item xs={6} sm={4} md={3} lg={2}>
							<MediaCard
								media={result}
							/>
						</Grid>;
					}
					return null;
				})}
			</Grid>
		) : (
			<Typography sx={{ p: 2 }}>No {title} Found</Typography>
		)}
	</Paper>
);
