import CloseIcon from '@mui/icons-material/Close';
import {
	Grid, Tab, Tabs, Dialog, Container, Typography,
	CardMedia, AppBar, Toolbar, Card, Slide, IconButton, Box,
	Stack, Divider, SlideProps
} from '@mui/material';
import * as React from 'react';
import { Dispatch, SetStateAction } from 'react';
import ReactMarkdown from 'react-markdown';

import { Media } from '../spriggan-shared/types/Media';

const Transition = React.forwardRef((props: SlideProps, ref) => <Slide direction="up" ref={ref} {...props} />);

export type TabPanelProps = {
	children: any,
	index: number,
	value: number,
};

const TabPanel = (props: TabPanelProps) => {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`full-width-tabpanel-${index}`}
			aria-labelledby={`full-width-tab-${index}`}
			{...other}
		>
			{value === index && (
				<Box sx={{ p: 3 }}>
					<Typography>{children}</Typography>
				</Box>
			)}
		</div>
	);
};

const TabProps = (index: number) => ({
	id: `full-width-tab-${index}`,
	'aria-controls': `full-width-tabpanel-${index}`,
});

export type MediaPageProps = {
	media: Media;
	launch: () => void;
	open: boolean,
	setOpen: Dispatch<SetStateAction<boolean>>
};

export const MediaPage = (props: MediaPageProps) => {

	const [tab, setTab] = React.useState(0);

	const handleClose = () => {
		props.setOpen(false);
	};

	const handleTabChange = (event: React.SyntheticEvent<Element, Event>, newValue: number) => {
		setTab(newValue);
	};

	return (
		<Dialog
			fullScreen
			open={props.open}
			onClose={handleClose}
			TransitionComponent={Transition}
		>
			<AppBar sx={{ position: 'relative' }}>
				<Toolbar>
					<IconButton
						edge="start"
						color="inherit"
						onClick={handleClose}
						aria-label="close"
					>
						<CloseIcon />
					</IconButton>
					<Typography sx={{ ml: 2, flex: 1 }} variant="h6">
						{props.media.title}
					</Typography>
				</Toolbar>
			</AppBar>
			<Container fixed>
				<AppBar position="static">
					<Tabs
						value={tab}
						onChange={handleTabChange}
						indicatorColor="secondary"
						textColor="inherit"
						variant="fullWidth"
					>
						<Tab label="Trailer" {...TabProps(0)} />
						<Tab label="Screenshots" {...TabProps(1)} />
					</Tabs>
				</AppBar>
				<Grid container height={420} sx={{ width: '100%', m: 0 }}>
					<Grid id="mediaSection" item xs={12} md={8} sx={{ m: 0, p: 0, height: '100%' }}>
						<TabPanel value={tab} index={0}>
							<Card sx={{ m: 0, p: 2, height: '100%' }} >
								<CardMedia
									component="iframe"
									src={(props.media.trailerSource === 'youtube') ? `https://www.youtube.com/embed/${props.media.trailer}?autoplay=1&origin=http://.com` : ""}
									height={'360'}
								/>
							</Card>
						</TabPanel>
						<TabPanel value={tab} index={1}>
							asdf
						</TabPanel>
					</Grid>
					<Grid id="infoSection" item xs={12} md={4} sx={{ height: '100%' }}>
						<Stack sx={{ height: '100%' }}>
							<Card sx={{ p: 1, m: 1, height: '60%' }}>
								<Typography p={1} variant="h5">{props.media.title}</Typography>
								<Divider />
								<Typography p={2}>{props.media.description}</Typography>
								<Divider />
								<Typography p={2}>{props.media.tags}</Typography>
							</Card>
						</Stack>
					</Grid>
					<Card sx={{ m: 1, p: 4, width: '100%' }}>
						<ReactMarkdown children={props.media.longDescription} />
					</Card>
				</Grid>
			</Container>
		</Dialog>
	);
};

