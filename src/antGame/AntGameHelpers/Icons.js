// prettier-ignore
export const PlayIcon = () => {
    return (
        <svg width="11px" height="14px" viewBox="0 0 11 14" version="1.1" xmlns="http://www.w3.org/2000/svg" style={styles.icon}>
            <g id="Icons" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                <g id="Rounded" transform="translate(-753.000000, -955.000000)">
                    <g id="AV" transform="translate(100.000000, 852.000000)">
                        <g id="-Round-/-AV-/-play_arrow" transform="translate(646.000000, 98.000000)">
                            <g>
                                <rect id="Rectangle-Copy-50" x="0" y="0" width="24" height="24"></rect>
                                <path d="M7,6.82 L7,17.18 C7,17.97 7.87,18.45 8.54,18.02 L16.68,12.84 C17.3,12.45 17.3,11.55 16.68,11.15 L8.54,5.98 C7.87,5.55 7,6.03 7,6.82 Z" id="🔹Icon-Color" fill="#1D1D1D"></path>
                            </g>
                        </g>
                    </g>
                </g>
            </g>
        </svg>
    );
}

// prettier-ignore
export const PauseIcon = () => {
    return (
        <svg width="11px" height="14px" viewBox="0 0 6 8" version="1.1" xmlns="http://www.w3.org/2000/svg" style={styles.icon}>
            <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                <g id="Dribbble-Light-Preview" transform="translate(-227.000000, -3765.000000)" fill="#000000">
                    <g id="icons" transform="translate(56.000000, 160.000000)">
                        <path d="M172,3605 C171.448,3605 171,3605.448 171,3606 L171,3612 C171,3612.552 171.448,3613 172,3613 C172.552,3613 173,3612.552 173,3612 L173,3606 C173,3605.448 172.552,3605 172,3605 M177,3606 L177,3612 C177,3612.552 176.552,3613 176,3613 C175.448,3613 175,3612.552 175,3612 L175,3606 C175,3605.448 175.448,3605 176,3605 C176.552,3605 177,3605.448 177,3606" id="pause-[#1006]"></path>
                    </g>
                </g>
            </g>
        </svg>    
    );
}

// prettier-ignore
export const MenuIcon = (props) => {
    return (
        <svg width="18px" height="12px" viewBox="0 0 18 12" version="1.1" xmlns="http://www.w3.org/2000/svg">
            <g id="Icons" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                <g id="Rounded" transform="translate(-885.000000, -3438.000000)">
                    <g id="Navigation" transform="translate(100.000000, 3378.000000)">
                        <g id="-Round-/-Navigation-/-menu" transform="translate(782.000000, 54.000000)">
                            <g transform="translate(0.000000, 0.000000)">
                                <polygon id="Path" points="0 0 24 0 24 24 0 24"></polygon>
                                <path d="M4,18 L20,18 C20.55,18 21,17.55 21,17 C21,16.45 20.55,16 20,16 L4,16 C3.45,16 3,16.45 3,17 C3,17.55 3.45,18 4,18 Z M4,13 L20,13 C20.55,13 21,12.55 21,12 C21,11.45 20.55,11 20,11 L4,11 C3.45,11 3,11.45 3,12 C3,12.55 3.45,13 4,13 Z M3,7 C3,7.55 3.45,8 4,8 L20,8 C20.55,8 21,7.55 21,7 C21,6.45 20.55,6 20,6 L4,6 C3.45,6 3,6.45 3,7 Z" id="🔹-Icon-Color" fill={props.color}></path>
                            </g>
                        </g>
                    </g>
                </g>
            </g>
        </svg>
    );
}

const styles = {
  icon: {
    width: "2em",
    verticalAlign: "baseline",
  },
};
