import Lottie from "lottie-react";

interface LottieAnimationProps {
    animationData: any;
    w: number;
    h: number;
}

const LottieAnimation = ({ animationData, w, h }: LottieAnimationProps) => {
    return (
        <div style={{ width: w, height: h }}>
            <Lottie
                loop={true}
                animationData={animationData}
            />
        </div>
    );
};

export default LottieAnimation;