import CheckTwoToneIcon from '@mui/icons-material/CheckTwoTone';
import CloseIcon from '@mui/icons-material/Close';
import CloseTwoToneIcon from '@mui/icons-material/CloseTwoTone';
import DownloadIcon from '@mui/icons-material/Download';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import {
	Grid,
	Dialog,
	Typography,
	AppBar,
	Toolbar,
	Paper,
	Slide,
	IconButton,
	Stack,
	Divider,
	SlideProps,
	Switch,
	Button,
	Box,
	Chip,
} from '@mui/material';
import CircularProgress, { CircularProgressProps } from '@mui/material/CircularProgress';
import * as React from 'react';
import { Dispatch, SetStateAction } from 'react';
import ReactMarkdown from 'react-markdown';

import { useSlimeApi } from '../slime-shared/contexts/SlimeApiContext';
import { Media } from '../slime-shared/types/slime/Media';
import {
	DownloadMediaRequest,
	GetInstallStatusRequest,
	InstallMediaRequest,
	InstallStatus,
	LaunchMediaRequest,
} from '../slime-shared/types/slime/SlimeRpcTypes';

const Transition = React.forwardRef((props: SlideProps, ref) => <Slide direction="up" ref={ref} {...props} />);

export type TabPanelProps = {
	children: any;
	index: number;
	value: number;
};

function CircularProgressWithLabel(props: CircularProgressProps & { value: number }) {
	return (
		<Box sx={{ position: 'relative', display: 'inline-flex' }}>
			<CircularProgress variant="determinate" {...props} />
			<Box
				sx={{
					top: 0,
					left: 0,
					bottom: 0,
					right: 0,
					position: 'absolute',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<Typography variant="caption" component="div" color="text.secondary">{`${Math.round(props.value)}%`}</Typography>
			</Box>
		</Box>
	);
}

export type MediaPageProps = {
	media: Media;
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
};

export const MediaPage = (props: MediaPageProps) => {
	const { media, open, setOpen } = props;
	const { slimeConfig } = useSlimeApi();

	const [status, setStatus] = React.useState<InstallStatus>();
	const [updateStatus, setUpdateStatus] = React.useState<boolean>();

	const { downloadMedia, getInstallStatus, installMedia, uninstallMedia, launchMedia, deleteMedia } = useSlimeApi();

	const [title, setTitle] = React.useState<string | undefined>(undefined);
	const [description, setDescription] = React.useState<string | undefined>(undefined);
	const [longDescription, setLongDescription] = React.useState<string | undefined>(undefined);

	React.useEffect(() => {
		if (open) {
			let foundTitle = false;
			let foundDescription = false;
			let foundLongDescription = false;

			slimeConfig?.languages.forEach((language) => {
				if (!foundTitle) {
					media.titles.forEach((titleI) => {
						if (titleI.language === language && !foundTitle) {
							foundTitle = true;
							setTitle(titleI.title);
						}
					});
				}
				if (!foundDescription) {
					media.descriptions.forEach((descriptionI) => {
						if (descriptionI.language === language && descriptionI.type === 'short' && !foundDescription) {
							foundDescription = true;
							setDescription(descriptionI.description);
						}
					});
				}
				if (!foundLongDescription) {
					media.descriptions.forEach((descriptionI) => {
						if (descriptionI.language === language && descriptionI.type === 'long' && !foundLongDescription) {
							foundLongDescription = true;
							setLongDescription(descriptionI.description);
						}
					});
				}
			});

			if (!foundTitle) {
				setTitle(media.titles[0].title);
			}
			if (!foundDescription) {
				setDescription(media.descriptions[0].description);
			}
			if (!foundLongDescription) {
				setLongDescription(media.descriptions[0].description);
			}
		}
	}, [media, slimeConfig?.languages, open]);

	React.useEffect(() => {
		const getStatus = async () => {
			if (open) {
				try {
					const result = await getInstallStatus({ media } as GetInstallStatusRequest);
					console.log('getInstallStatus result: ', result);
					setStatus(undefined);
				} catch (error) {
					console.log('error: ', error);
				}
			}
		};
		if (updateStatus) {
			getStatus();
			setUpdateStatus(false);
		}
	}, [getInstallStatus, media, open, updateStatus]);

	const handleClose = () => {
		setOpen(false);
	};

	return (
		<Dialog fullScreen open={open} onClose={handleClose} TransitionComponent={Transition}>
			<AppBar sx={{ position: 'relative' }}>
				<Toolbar>
					<IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
						<CloseIcon />
					</IconButton>
					<Typography sx={{ ml: 2, flex: 1 }} variant="h6">
						{title}
					</Typography>
				</Toolbar>
			</AppBar>
			<Grid container sx={{ width: '100%' }}>
				<Grid id="mediaSection" item xs={12} md={8}>
					<Paper sx={{ height: '100%', m: 2 }}>
						<Grid container height={420} sx={{ width: '100%' }}>
							<Grid item xs={3} sx={{}}>
								<Typography p={1}>Downloaded:</Typography>
							</Grid>
							<Grid item xs={2} sx={{}}>
								{status?.isDownloading ? (
									<CircularProgressWithLabel value={status?.progress} />
								) : status?.isDownloaded ? (
									<CheckTwoToneIcon />
								) : (
									<CloseTwoToneIcon />
								)}
							</Grid>
							<Grid item xs={6} sx={{}}>
								{status?.isDownloaded ? (
									<Button variant="contained">Delete</Button>
								) : (
									<Button
										variant="contained"
										onClick={async () => {
											const resp = await downloadMedia({ media } as DownloadMediaRequest);
											console.log('downloadMedia resp: ', resp);
											setUpdateStatus(true);
										}}
									>
										Download
									</Button>
								)}
								{status?.isDownloading && (
									<Button
										variant="contained"
										onClick={async () => {
											const resp = await deleteMedia({ media } as DownloadMediaRequest);
											console.log('deleteMedia resp: ', resp);
											setUpdateStatus(true);
										}}
									>
										Cancel
									</Button>
								)}
							</Grid>
							<Grid item xs={3} sx={{}}>
								<Typography p={1}>Installed:</Typography>
							</Grid>
							<Grid item xs={2} sx={{}}>
								{status?.isInstalled ? <CheckTwoToneIcon /> : <CloseTwoToneIcon />}
							</Grid>
							<Grid item xs={6} sx={{}}>
								{status?.isInstalled ? (
									<Button
										variant="contained"
										onClick={async () => {
											const resp = await uninstallMedia({ media } as InstallMediaRequest);
											console.log('uninstallMedia resp: ', resp);
											setUpdateStatus(true);
										}}
									>
										Uninstall
									</Button>
								) : (
									<Button
										variant="contained"
										onClick={async () => {
											const resp = await installMedia({ media } as InstallMediaRequest);
											console.log('installMedia resp: ', resp);
											setUpdateStatus(true);
										}}
									>
										Install
									</Button>
								)}
							</Grid>
							<Grid item xs={3} sx={{}}>
								<Typography p={1}>Seeding:</Typography>
							</Grid>
							<Grid item xs={2} sx={{}}>
								{status?.isSeeding ? <CheckTwoToneIcon /> : <CloseTwoToneIcon />}
							</Grid>
							<Grid item xs={6} sx={{}}>
								<Switch disabled={!status?.isDownloaded} value={status?.isSeeding} onChange={() => {}} />
								<FileUploadIcon />
								{status?.uploadRate} <DownloadIcon />
								{status?.downloadRate}
							</Grid>
							<Grid item xs={3} sx={{}}>
								<Button
									onClick={async () => {
										const resp = launchMedia({ media } as LaunchMediaRequest);
										console.log('launchMedia resp: ', resp);
									}}
								>
									Launch
								</Button>
							</Grid>
						</Grid>
					</Paper>
				</Grid>
				<Grid id="infoSection" item xs={6} md={4} sx={{ height: '100%' }}>
					<Paper elevation={1} sx={{ height: '100%', m: 2 }}>
						<Stack justifyContent={'space-between'} alignContent={'center'} direction="column" height={'100%'}>
							<Box>
								<Typography variant="h5">{title}</Typography>
								<Divider />
							</Box>
							<Box>
								<Typography height={'100%'}>{description}</Typography>
							</Box>
							<Box>
								<Divider />
								{media.tags.map((tag, index) => (
									<Chip size="small" label={tag.tag} key={index} sx={{ m: 1 }} />
								))}
							</Box>
						</Stack>
					</Paper>
				</Grid>
				<Grid id="descriptionSection" item xs={12}>
					<Paper sx={{ width: '100%', m: 4 }}>
						<ReactMarkdown children={longDescription || ''} />
					</Paper>
				</Grid>
			</Grid>
		</Dialog>
	);
};
