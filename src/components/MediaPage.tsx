import CheckTwoToneIcon from '@mui/icons-material/CheckTwoTone';
import CloseIcon from '@mui/icons-material/Close';
import CloseTwoToneIcon from '@mui/icons-material/CloseTwoTone';
import DownloadIcon from '@mui/icons-material/Download';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import {
	Grid, Dialog, Container, Typography, AppBar, Toolbar, Card, Slide, IconButton,
	Stack, Divider, SlideProps, Switch, Button, Box
} from '@mui/material';
import CircularProgress, {
	CircularProgressProps,
} from '@mui/material/CircularProgress';
import * as React from 'react';
import { Dispatch, SetStateAction } from 'react';
import ReactMarkdown from 'react-markdown';

import { useSprigganRpc } from '../spriggan-shared/contexts/SprigganRpcContext';
import { Media } from '../spriggan-shared/types/spriggan/Media';
import { DownloadMediaRequest, GetInstallStatusRequest, GetInstallStatusResponse, InstallMediaRequest, InstallStatus, PlayMediaRequest } from '../spriggan-shared/types/spriggan/SprigganRpcTypes';

const Transition = React.forwardRef((props: SlideProps, ref) => <Slide direction="up" ref={ref} {...props} />);

export type TabPanelProps = {
	children: any,
	index: number,
	value: number,
};

function CircularProgressWithLabel(
	props: CircularProgressProps & { value: number },
) {
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
				<Typography
					variant="caption"
					component="div"
					color="text.secondary"
				>{`${Math.round(props.value)}%`}</Typography>
			</Box>
		</Box>
	);
}

export type MediaPageProps = {
	media: Media;
	open: boolean,
	setOpen: Dispatch<SetStateAction<boolean>>
};

export const MediaPage = (props: MediaPageProps) => {

	const { downloadMedia, installMedia, getInstallStatus, getTorrentStatus, deleteMedia, uninstallMedia, playMedia } = useSprigganRpc();

	const [status, setStatus] = React.useState<InstallStatus>();

	React.useEffect(() => {
		const interval = setInterval(async () => {
			if (props.open) {
				try {
					const result = (await getInstallStatus({ media: props.media } as GetInstallStatusRequest)).result as GetInstallStatusResponse;
					setStatus(result.status);
				} catch (error) {
					console.log("error: ", error);
				}
			}
		}, 1000);
		return () => clearInterval(interval);
	}, [getInstallStatus, getTorrentStatus, props.media, props.open]);

	const handleClose = () => {
		props.setOpen(false);
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
				<Grid container height={420} sx={{ width: '100%', m: 0 }}>
					<Grid id="mediaSection" item xs={12} md={8} sx={{ m: 0, p: 0, height: '100%' }}>
						<Card sx={{ m: 0, p: 2, height: '100%' }} >
							<Grid container height={420} sx={{ width: '100%', m: 0 }}>
								<Grid item xs={3} sx={{ m: 0, p: 0 }}>
									<Typography p={1}>Downloaded:</Typography>
								</Grid>
								<Grid item xs={2} sx={{ m: 0, p: 0 }}>
									{status?.isDownloading
										?
										<CircularProgressWithLabel value={status?.progress} />
										:
										status?.isDownloaded ? <CheckTwoToneIcon /> : <CloseTwoToneIcon />
									}

								</Grid>
								<Grid item xs={6} sx={{ m: 0, p: 0 }}>
									{status?.isDownloaded ?
										<Button variant='contained'>Delete</Button>
										:
										<Button variant='contained' onClick={() => {
											downloadMedia({ media: props.media } as DownloadMediaRequest);
										}}>Download</Button>
									}
									{status?.isDownloading &&
										<Button variant='contained' onClick={() => {
											deleteMedia({ media: props.media } as DownloadMediaRequest);
										}}>Cancel</Button>
									}
								</Grid>
								<Grid item xs={3} sx={{ m: 0, p: 0 }}>
									<Typography p={1}>Installed:</Typography>
								</Grid>
								<Grid item xs={2} sx={{ m: 0, p: 0 }}>
									{status?.isInstalled ? <CheckTwoToneIcon /> : <CloseTwoToneIcon />}
								</Grid>
								<Grid item xs={6} sx={{ m: 0, p: 0 }}>
									{status?.isInstalled ?
										<Button variant='contained' onClick={() => {
											uninstallMedia({ media: props.media } as InstallMediaRequest);
										}}>Uninstall</Button>
										:
										<Button variant='contained' onClick={() => {
											installMedia({ media: props.media } as InstallMediaRequest);
										}}>Install</Button>
									}
								</Grid>
								<Grid item xs={3} sx={{ m: 0, p: 0 }}>
									<Typography p={1}>Seeding:</Typography>
								</Grid>
								<Grid item xs={2} sx={{ m: 0, p: 0 }}>
									{status?.isSeeding ? <CheckTwoToneIcon /> : <CloseTwoToneIcon />}
								</Grid>
								<Grid item xs={6} sx={{ m: 0, p: 0 }}>
									<Switch disabled={!status?.isDownloaded} value={status?.isSeeding} onChange={() => { }} />
									<FileUploadIcon />{status?.uploadRate} <DownloadIcon />{status?.downloadRate}
								</Grid>
								<Grid item xs={3} sx={{ m: 0, p: 0 }}>
									<Button onClick={
										() => {
											playMedia({ media: props.media } as PlayMediaRequest);
										}
									}>Launch</Button>
								</Grid>
							</Grid>
						</Card>
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
			</Container >
		</Dialog >
	);
};

