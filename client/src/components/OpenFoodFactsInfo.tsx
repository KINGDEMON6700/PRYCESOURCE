import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { 
  Leaf, 
  Heart, 
  Info, 
  Award, 
  Scale, 
  AlertCircle,
  Check,
  X,
  MapPin,
  Package,
  Zap,
  Droplets,
  Wheat,
  Beef,
  Milk,
  Egg,
  Fish,
  Nut,
  Soy
} from "lucide-react";
import { useProductEnrichment } from "@/hooks/useOpenFoodFacts";
import { 
  formatNutritionInfo, 
  getNutriScoreInfo, 
  getEcoScoreInfo, 
  getNovaInfo,
  OpenFoodFactsProduct 
} from "@/services/openFoodFacts";

interface OpenFoodFactsInfoProps {
  product: {
    id: number;
    name: string;
    barcode?: string | null;
    brand?: string | null;
  };
}

export function OpenFoodFactsInfo({ product }: OpenFoodFactsInfoProps) {
  const { data: offProduct, isLoading, error } = useProductEnrichment(product);

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <LoadingSpinner />
            <span className="ml-2 text-gray-400">Chargement des informations nutritionnelles...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !offProduct) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center text-gray-400">
            <Info className="h-5 w-5 mr-2" />
            <span>Informations nutritionnelles non disponibles</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const nutritionInfo = formatNutritionInfo(offProduct);
  const nutriScore = getNutriScoreInfo(offProduct.nutriscore_grade);
  const ecoScore = getEcoScoreInfo(offProduct.ecoscore_grade);
  const novaInfo = getNovaInfo(offProduct.nova_group);

  return (
    <div className="space-y-6">
      {/* Scores et évaluations */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Award className="h-5 w-5" />
            Évaluations nutritionnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Nutri-Score */}
            <div className="text-center">
              <div className="mb-2">
                <Badge 
                  variant="outline" 
                  className={`text-lg font-bold px-3 py-1 bg-${nutriScore.color}-100 text-${nutriScore.color}-800 border-${nutriScore.color}-300`}
                >
                  {nutriScore.grade}
                </Badge>
              </div>
              <p className="text-sm text-gray-400 mb-1">Nutri-Score</p>
              <p className="text-xs text-gray-500">{nutriScore.description}</p>
            </div>

            {/* Eco-Score */}
            <div className="text-center">
              <div className="mb-2">
                <Badge 
                  variant="outline" 
                  className={`text-lg font-bold px-3 py-1 bg-${ecoScore.color}-100 text-${ecoScore.color}-800 border-${ecoScore.color}-300`}
                >
                  {ecoScore.grade}
                </Badge>
              </div>
              <p className="text-sm text-gray-400 mb-1">Eco-Score</p>
              <p className="text-xs text-gray-500">{ecoScore.description}</p>
            </div>

            {/* NOVA */}
            <div className="text-center">
              <div className="mb-2">
                <Badge 
                  variant="outline" 
                  className={`text-lg font-bold px-3 py-1 bg-${novaInfo.color}-100 text-${novaInfo.color}-800 border-${novaInfo.color}-300`}
                >
                  {novaInfo.group}
                </Badge>
              </div>
              <p className="text-sm text-gray-400 mb-1">NOVA</p>
              <p className="text-xs text-gray-500">{novaInfo.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations nutritionnelles */}
      {Object.keys(nutritionInfo).some(key => nutritionInfo[key as keyof typeof nutritionInfo]) && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Informations nutritionnelles (pour 100g)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {nutritionInfo.energy && (
                <div className="text-center">
                  <Zap className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                  <p className="text-sm font-medium text-white">{nutritionInfo.energy}</p>
                  <p className="text-xs text-gray-400">Énergie</p>
                </div>
              )}
              {nutritionInfo.fat && (
                <div className="text-center">
                  <Droplets className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                  <p className="text-sm font-medium text-white">{nutritionInfo.fat}</p>
                  <p className="text-xs text-gray-400">Lipides</p>
                </div>
              )}
              {nutritionInfo.carbs && (
                <div className="text-center">
                  <Wheat className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                  <p className="text-sm font-medium text-white">{nutritionInfo.carbs}</p>
                  <p className="text-xs text-gray-400">Glucides</p>
                </div>
              )}
              {nutritionInfo.protein && (
                <div className="text-center">
                  <Beef className="h-5 w-5 mx-auto mb-1 text-red-500" />
                  <p className="text-sm font-medium text-white">{nutritionInfo.protein}</p>
                  <p className="text-xs text-gray-400">Protéines</p>
                </div>
              )}
              {nutritionInfo.sugars && (
                <div className="text-center">
                  <div className="h-5 w-5 mx-auto mb-1 bg-pink-500 rounded-full" />
                  <p className="text-sm font-medium text-white">{nutritionInfo.sugars}</p>
                  <p className="text-xs text-gray-400">Sucres</p>
                </div>
              )}
              {nutritionInfo.salt && (
                <div className="text-center">
                  <div className="h-5 w-5 mx-auto mb-1 bg-gray-300 rounded-full" />
                  <p className="text-sm font-medium text-white">{nutritionInfo.salt}</p>
                  <p className="text-xs text-gray-400">Sel</p>
                </div>
              )}
              {nutritionInfo.fiber && (
                <div className="text-center">
                  <Leaf className="h-5 w-5 mx-auto mb-1 text-green-500" />
                  <p className="text-sm font-medium text-white">{nutritionInfo.fiber}</p>
                  <p className="text-xs text-gray-400">Fibres</p>
                </div>
              )}
              {nutritionInfo.saturatedFat && (
                <div className="text-center">
                  <AlertCircle className="h-5 w-5 mx-auto mb-1 text-red-400" />
                  <p className="text-sm font-medium text-white">{nutritionInfo.saturatedFat}</p>
                  <p className="text-xs text-gray-400">Graisses saturées</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ingrédients */}
      {offProduct.ingredients_text_fr && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="h-5 w-5" />
              Ingrédients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-300 leading-relaxed">
              {offProduct.ingredients_text_fr}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Allergènes */}
      {offProduct.allergens && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Allergènes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {offProduct.allergens.split(',').map((allergen, index) => (
                <Badge key={index} variant="destructive" className="text-xs">
                  {allergen.trim().replace('en:', '')}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Labels et certifications */}
      {offProduct.labels && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Award className="h-5 w-5" />
              Labels et certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {offProduct.labels.split(',').map((label, index) => (
                <Badge key={index} variant="outline" className="text-xs text-green-400 border-green-400">
                  {label.trim().replace(/^(en|fr):/, '')}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations sur l'origine */}
      {(offProduct.countries || offProduct.origins || offProduct.manufacturing_places) && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Origine et fabrication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {offProduct.countries && (
              <div className="text-sm">
                <span className="text-gray-400">Pays de vente: </span>
                <span className="text-white">{offProduct.countries}</span>
              </div>
            )}
            {offProduct.origins && (
              <div className="text-sm">
                <span className="text-gray-400">Origine des ingrédients: </span>
                <span className="text-white">{offProduct.origins}</span>
              </div>
            )}
            {offProduct.manufacturing_places && (
              <div className="text-sm">
                <span className="text-gray-400">Lieu de fabrication: </span>
                <span className="text-white">{offProduct.manufacturing_places}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informations supplémentaires */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Info className="h-5 w-5" />
            Informations supplémentaires
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {offProduct.quantity && (
            <div className="text-sm">
              <span className="text-gray-400">Quantité: </span>
              <span className="text-white">{offProduct.quantity}</span>
            </div>
          )}
          {offProduct.packaging && (
            <div className="text-sm">
              <span className="text-gray-400">Emballage: </span>
              <span className="text-white">{offProduct.packaging}</span>
            </div>
          )}
          {offProduct.serving_size && (
            <div className="text-sm">
              <span className="text-gray-400">Portion: </span>
              <span className="text-white">{offProduct.serving_size}</span>
            </div>
          )}
          {offProduct.stores && (
            <div className="text-sm">
              <span className="text-gray-400">Magasins: </span>
              <span className="text-white">{offProduct.stores}</span>
            </div>
          )}
          {offProduct.code && (
            <div className="text-sm">
              <span className="text-gray-400">Code-barres: </span>
              <span className="text-white font-mono">{offProduct.code}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Source */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Données fournies par{" "}
          <a 
            href={`https://fr.openfoodfacts.org/produit/${offProduct.code}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            OpenFoodFacts
          </a>
        </p>
      </div>
    </div>
  );
}