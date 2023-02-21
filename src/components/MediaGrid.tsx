import { Grid, Typography } from "@mui/material";
import Paper from "@mui/material/Paper";
import { Media } from "../spriggan-shared/types/Media";
import MediaCard from "./MediaCard";

const MediaGrid = (
		title: string,
		searchResults: Media[],
	) => {

	return (
		<Paper elevation={1} sx={{ m:2 }}>
			<Typography sx={{ p:2 }} variant="h4">{title}</Typography>
			<Grid container p={4} spacing={4} id="medialist">
					{searchResults && searchResults.map((result: Media) => (
						<Grid key={result.title} item xs={6} sm={4} md={3} lg={2}>
						<MediaCard
							media={result}
							/>
						</Grid>
					))}
			</Grid>
		</Paper>
	);
}

export default MediaGrid;