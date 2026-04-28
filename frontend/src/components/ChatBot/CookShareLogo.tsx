const CookShareLogo = ({ size = 24 }: { size?: number }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 64 64"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		{/* Chef hat */}
		<ellipse cx="32" cy="18" rx="18" ry="14" fill="white" />
		<ellipse cx="20" cy="16" rx="8" ry="10" fill="white" />
		<ellipse cx="44" cy="16" rx="8" ry="10" fill="white" />
		<ellipse cx="32" cy="14" rx="10" ry="12" fill="white" />
		{/* Hat band */}
		<rect x="16" y="24" width="32" height="8" rx="2" fill="white" />
		{/* Spatula handle */}
		<rect
			x="29"
			y="34"
			width="6"
			height="20"
			rx="2"
			fill="#ff8c42"
		/>
		{/* Spatula head */}
		<rect
			x="26"
			y="50"
			width="12"
			height="10"
			rx="3"
			fill="#ff8c42"
		/>
		<rect
			x="28"
			y="52"
			width="8"
			height="2"
			rx="1"
			fill="#e07530"
		/>
		<rect
			x="28"
			y="56"
			width="8"
			height="2"
			rx="1"
			fill="#e07530"
		/>
	</svg>
);

export default CookShareLogo;
