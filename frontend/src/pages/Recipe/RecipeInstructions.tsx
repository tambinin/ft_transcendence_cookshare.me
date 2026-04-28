import { GiKnifeFork } from 'react-icons/gi';

interface Instruction {
	id: string;
	description: string;
}

const RecipeInstructions = ({ instructions, description }: { instructions?: Instruction[]; description?: string }) => (
	<>
		{description && (
			<section>
				<p className="text-white/80 text-lg leading-relaxed">{description}</p>
			</section>
		)}
		<section>
			<h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
				<GiKnifeFork className="text-orange-400" />
				Instructions
			</h2>
			<div className="space-y-6">
				{instructions?.map((instruction, index) => (
					<div key={instruction.id} className="flex gap-4">
						<div className="shrink-0 w-10 h-10 rounded-full bg-orange-400/20 text-orange-400 flex items-center justify-center font-bold">
							{index + 1}
						</div>
						<p className="text-white/80 pt-2">{instruction.description}</p>
					</div>
				))}
			</div>
		</section>
	</>
);

export default RecipeInstructions;
